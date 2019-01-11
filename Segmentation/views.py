from django.shortcuts import render, redirect
from Management.models import Database, Trajectory, POI_ROI, TrajectoryFeature
from django.http import JsonResponse
from .models import TrajectorySegmentation,SegmentFeature,Segment
import Segmentation.utils as utils
from django.contrib.auth.decorators import login_required
import json
from datetime import datetime
from trajectory_library.TrajectoryDescriptorFeature import TrajectoryDescriptorFeature

def pick_set(request):
    if request.method == 'GET':
        dblist = []
        dbs = Database.objects.all()
        for db in dbs:
            print(db.taggers)
            if request.user.id in db.taggers_id:
                dblist.append((str(db._id),db.name))
        return render(request,'pick_database.html',{'databases':dblist})
    else:
        db = request.POST.get('database', "")
        return redirect('/segmentation/database/%s/' % db)



@login_required()
def load_segment_session(request, db_id=""):
    if db_id == "":
        return redirect('/segmentation/database/')
    layers = list(POI_ROI.objects.filter(db___id=db_id).values())
    for layer in layers:
        layer['_id']= str(layer['_id'])
        layer['db_id'] = str(layer['db_id'])
    #trajectory = utils.get_trajectory(request.user, db_id, None)
    trajectories = Trajectory.objects.filter(db___id=db_id)
    traj = trajectories.values().first()
    traj['_id'] = str(traj['_id'])
    traj['db_id'] = str(traj['db_id'])
    point_features = TrajectoryFeature.objects.filter(trajectory___id=traj['_id']).values()
    curr_pf = point_features.first()
    pfs = []
    for pf in point_features:
        pfs.append({'id':pf['_id'], 'name':pf['name']})
    curr_pf['_id'] = str(curr_pf['_id'])
    curr_pf['trajectory_id'] = str(curr_pf['trajectory_id'])
    layers_json = json.dumps(layers)
    traj_json = json.dumps(traj)
    curr_pf_json = json.dumps(curr_pf)
    labels = Database.objects.get(_id=db_id).labels
    labels_json = json.dumps(labels)
    return render(request, 'segmentation_page.html', {'layers': layers_json, 'trajectory': traj_json, 'curr_pf': curr_pf_json,'point_features':pfs,'labels':labels_json})


@login_required()
def get_trajectory(request,traj_id):
    Trajectory.objects.get(_id=traj_id)
    
    return



def submit_segmentation(request):
    markers = request.POST.get('marker_locations', [])
    id = request.POST.get('id', None)

    print(request.POST)
    print(markers)

    markers_list = json.loads(markers)
    markers_list.sort(key = lambda  x: x['start_index'], reverse=False)

    print(markers_list)
    if id is not None:
        traj = Trajectory.objects.get(_id=id)

    feats = TrajectoryFeature.objects.filter(trajectory___id=id)
    segment_list = []
    for segment in markers_list:
        s = Segment()
        s.start_index = segment['start_index']
        s.end_index = segment['end_index']
        s.label = segment['label']
        feat_list = []
        for f in feats:
            sf = SegmentFeature()
            values = f.values[segment['start_index']:segment['end_index']+1]
            tdf = TrajectoryDescriptorFeature()
            feat_stats = tdf.describe(values)
            sf.min = feat_stats[0]
            sf.max = feat_stats[1]
            sf.mean = feat_stats[2]
            sf.median = feat_stats[3]
            sf.std = feat_stats[4]
            sf.percentile_10 = feat_stats[5]
            sf.percentile_25 = feat_stats[6]
            sf.percentile_50 = feat_stats[7]
            sf.percentile_75 = feat_stats[8]
            sf.percentile_90 = feat_stats[9]
            sf.name = f.name
            feat_list.append(sf)
        s.features = feat_list
        segment_list.append(s)

    try:
        segment = TrajectorySegmentation.objects.get(trajectory___id=id,user_id=request.user.id)
    except:
        segment = TrajectorySegmentation()

    segment.trajectory = traj
    segment.segmentation = segment_list
    segment.user = request.user
    segment.start_time = datetime.strptime(request.POST.get('start_time', None), "%a, %d %b %Y %H:%M:%S %Z")
    segment.end_time = datetime.strptime(request.POST.get('end_time', None), "%a, %d %b %Y %H:%M:%S %Z")
    segment.save()
    return JsonResponse({})

def review_session(request, session_id=""):
    return render(request,'session_information.html')
1