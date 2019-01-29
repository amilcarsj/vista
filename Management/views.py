from django.shortcuts import render, redirect
from Management.models import Database, Trajectory, TrajectoryFeature, POI_ROI
import Management.utils as utils
from django.http import JsonResponse
from django.forms.models import model_to_dict
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
import datetime
# Create your views here.

@login_required()
def update_database(request, _id=""):
    if _id == '':
        return render(request, 'select_database.html')
    if request.method == 'GET':
        return render(request, 'database_management.html')
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
    return render(request, 'database_management.html')


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
    return render(request, 'trajectory_table.html', {'databases': dbs, 'trajectories': trajectories})


@login_required()
def get_trajectories(request, db_id=""):
    trajectories = list(Trajectory.objects.filter(db_id=db_id).values('_id','total_points','total_distance_traveled','average_sampling'))
    for t in trajectories:
        t['_id'] = str(t['_id'])
    semantic_layers = list(POI_ROI.objects.filter(db_id=db_id).values())
    for s in semantic_layers:
        s['_id'] = str(s['_id'])
        s['db_id'] = str(s['db_id'])
    print(semantic_layers)
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
