from djongo import models
import Management.models as management_models
from django.contrib.auth.models import User
# Create your models here.

class TrajectorySegmentation(models.Model):
    _id = models.ObjectIdField(primary_key=True)
    trajectory = models.ForeignKey(to=management_models.Trajectory, on_delete=models.SET_NULL)
    segmentation = models.DictField()
    user = models.ForeignKey(to=User, on_delete=models.SET_NULL)