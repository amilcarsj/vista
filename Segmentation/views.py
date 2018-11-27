from django.shortcuts import render, redirect
from Management.models import Database, Trajectory, POI_ROI, TrajectoryFeature
from .models import TrajectorySegmentation
import Segmentation.utils as utils
from django.forms.models import model_to_dict
import json


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




def load_segment_session(request, db_id=""):
    if db_id == "":
        return redirect('/segmentation/database/')
    layers = list(POI_ROI.objects.filter(db___id=db_id).values())
    for layer in layers:
        layer['_id']= str(layer['_id'])
        layer['db_id'] = str(layer['db_id'])
    #trajectory = utils.get_trajectory(request.user, db, None)
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

    return render(request, 'segmentation_page.html', {'layers': layers_json, 'trajectory': traj_json, 'curr_pf': curr_pf_json,'point_features':pfs})


def submit_segmentation(request, curr_id="", new_id=""):
    request.POST.get('segmentation', [])
