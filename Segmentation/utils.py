from .models import TrajectorySegmentation
from Management.models import Trajectory


def get_trajectory(user, db_id,traj_id):
    if traj_id is None:
        segmented_trajectories_ids = TrajectorySegmentation.objects.filter(trajectory__db__id=db_id, user=user).values('trajectory___id')
        unsegmented_trajectories = Trajectory.objects.filter(db_id=db_id).exclude(_id__in=segmented_trajectories_ids)
        trajectory = unsegmented_trajectories.first()
    else:
        trajectory = Trajectory.objects.get(_id = traj_id)
    trajectory._id = str(trajectory._id)
    return user