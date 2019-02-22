from django.shortcuts import render, redirect
from Management.models import Database, Trajectory, TrajectoryFeature, POI_ROI
import Management.utils as utils
from django.http import JsonResponse
from django.forms.models import model_to_dict
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
import datetime
from geopandas import GeoSeries
import pandas as pd
from djongo.sql2mongo import SQLDecodeError
from shapely.geometry import Point
# Create your views here.

@login_required()
def update_database(request, _id=""):
    trajectories = list(Trajectory.objects.filter(db___id=_id))

    if _id == '':
        return render(request, 'select_database.html')

    if request.method == 'POST':
        trajectory_files = request.FILES.getlist('trajectory-files[]')
        semantic_files = request.FILES.getlist('semantic-files')
        tid = request.POST.get('trajID',None)
        lat = request.POST.get('trajLat',None)
        lon = request.POST.get('trajLon',None)
        time = request.POST.get('trajTime',None)
        delimiter = request.POST.get('delimiter', None)
        taggers = request.POST.get('taggers', '').split(';')
        labels = request.POST.get('labels', '').split(';')
        for label in labels:
            label = label.strip()
            if label == '':
                labels.remove(label)

        for tagger in taggers:
            tagger = tagger.strip()
            if tagger == '':
                taggers.remove(tagger)

        db = Database.objects.get(_id=_id)
        if taggers is not None:
            users = list(User.objects.filter(email__in=taggers))
            for i in users:
                db.taggers.add(i)
        db.labels = labels
        db.save()
        pois_rois = []
        start = datetime.datetime.now()
        print(start)
        for file in semantic_files:
            name = request.POST.get("name_"+file.name,file.name)
            layer = utils.save_poi_roi(file, name,db)
            layer_data = []
            for t in trajectories:
                df = pd.DataFrame()

                points = GeoSeries([Point(p[0],p[1]) for p in t.geojson['geometry']['coordinates']])
                if layer.type == layer.POI:
                    l = utils.find_shortest_distance(points,layer,0.001)
                else:
                    l = utils.find_intersects(points,layer)
                layer_data.append(l)
                df[layer.name] = l
                utils.save_point_features(df,t)
            pois_rois.append(layer)
        count = 1

        for file in trajectory_files:
            print("%d of %d" %(count,len(trajectory_files)))
            count+=1
            iteration_time = datetime.datetime.now()
            print(file.name)
            utils.save_trajectory(file, tid, lat, lon, time, delimiter, db, pois_rois)
            print(str(datetime.datetime.now() - iteration_time))

        end = datetime.datetime.now()
        print(end)
        print("Time Difference " + str(end-start))
    print(trajectories)
    traj_list = []

    layers = list(POI_ROI.objects.filter(db___id=_id))
    trajectories = list(Trajectory.objects.filter(db___id=_id))

    db = Database.objects.get(_id=_id)
    for t in trajectories:
        traj_list.append({'id': t._id, 'total_points': t.total_points, 'distance': t.total_distance_traveled,
                          'sampling': t.average_sampling})
    layer_list = []
    for l in layers:
        layer_list.append({'id':l._id,'name':l.name,'type':l.type})
    users = User.objects.filter(id__in=db.taggers_id)

    return render(request, 'database_management.html',
                  {'trajectories': traj_list, 'layers': layer_list, 'taggers': users, 'labels': db.labels})


@login_required()
def select_database(request):
    r = None
    if request.method == 'GET':
        dbs = Database.objects.filter(tagging_session_manager=request.user)
        return render(request, 'select_database.html', {'databases': dbs})
    else:
        dbid = request.POST.get('database_select',None)
        if dbid is None:
            dbs = Database.objects.filter(tagging_session_manager=request.user)
            return render(request, 'select_database.html', {'databases': dbs})

        return redirect('/management/edit/database/%s/' % str(dbid))

@login_required()
def create_database(request):
    if request.method == "GET":
        dbs = Database.objects.filter(tagging_session_manager=request.user)
        return render(request, 'select_database.html', {'databases': dbs})
    else:
        dbname = request.POST.get('database_name', None)
        db = Database()
        db.name = dbname
        db.tagging_session_manager = request.user
        db.taggers = []
        db.labels = []
        db.save()
        print(db._id)
        return redirect('/management/edit/database/%s/' % str(db._id))


@login_required()
def visualize(request):
    dbs = Database.objects.filter(tagging_session_manager=request.user)
    db = dbs.first()
    trajectories = Trajectory.objects.filter(db=db)
    return render(request, 'visualize_session.html', {'databases': dbs, 'trajectories': trajectories})


@login_required()
def get_trajectories(request, db_id=""):
    trajectories = list(Trajectory.objects.filter(db_id=db_id).values('_id','total_points','total_distance_traveled','average_sampling'))
    for t in trajectories:
        t['_id'] = str(t['_id'])
    semantic_layers = list(POI_ROI.objects.filter(db_id=db_id).values())
    for s in semantic_layers:
        s['_id'] = str(s['_id'])
        s['db_id'] = str(s['db_id'])
    return JsonResponse({'trajectories': trajectories, 'semantic_layers': semantic_layers})


@login_required()
def get_trajectory(request, oid=""):
    geojson = Trajectory.objects.get(_id=oid).geojson
    pfs = TrajectoryFeature.objects.filter(trajectory___id=oid)
    curr_pf = pfs.first()
    id_names = list(pfs.values('name','_id'))
    for item in id_names:
        item['_id'] = str(item['_id'])
    curr_pf._id = str(curr_pf._id)
    curr_pf_dict = model_to_dict(curr_pf)
    curr_pf_dict['trajectory'] = str(curr_pf_dict['trajectory'])
    return JsonResponse({'trajectory':geojson,'point_features':id_names, 'current_pf': curr_pf_dict})


@login_required()
def get_point_feature(request, oid=""):
    pf = TrajectoryFeature.objects.get(_id=oid)
    pf._id = str(pf._id)
    pf_dict = model_to_dict(pf)
    pf_dict['trajectory'] = str(pf_dict['trajectory'])
    return JsonResponse({'point_feature': pf_dict})


@login_required()
def get_xy(request,x="",y=""):
    xvals = TrajectoryFeature.objects.get(_id=x).values
    yvals = TrajectoryFeature.objects.get(_id=y).values
    return JsonResponse({'xvals':xvals,'yvals':yvals})

@login_required()
def delete_traj(request,tid=""):
    Trajectory.objects.get(_id=tid).delete()
    return JsonResponse({})

@login_required()
def delete_layer(request,lid=""):
    obj = POI_ROI.objects.get(_id=lid)
    layer_name = obj.name + "_intersects" if obj.type == POI_ROI.ROI else "_shortest_distance"
    trajs = Trajectory.objects.filter(db___id=obj.db_id)
    TrajectoryFeature.objects.filter(name=layer_name).filter(trajectory__in=trajs).delete()
    obj.delete()
    return JsonResponse({})