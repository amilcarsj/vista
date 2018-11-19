from django.shortcuts import render
from Management.models import Database, Trajectory
from .models import TrajectorySegmentation


def pick_set(request):
    dblist = []
    dbs = Database.objects.all()
    for db in dbs:
        if request.user in db.taggers:
            dblist.append((str(db._id),db.name))
    return render(request,'pick_database.html',{'dblist':dblist})


def get_unsegmented_trajectory(request, db_id="", traj_id=""):
    if traj_id == "":
        segmented_trajectories = TrajectorySegmentation.objects.filter(trajectory__db__tagging_session_manager=request.user, )
        trajectory_ids = Trajectory.objects.filter(db__tagging_session_manager=request.user,db___id=db_id).values('_id')



def submit_segmentation(request):
    request.POST.get('segmentation', [])
