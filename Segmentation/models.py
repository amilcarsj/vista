from djongo import models
import Management.models as management_models
from django.contrib.auth.models import User
# Create your models here.


class SegmentFeature(models.Model):
    name = models.CharField(max_length=20)
    std = models.FloatField()
    min = models.FloatField()
    max = models.FloatField()
    mean = models.FloatField()
    median = models.FloatField()
    percentile_10 = models.FloatField()
    percentile_25 = models.FloatField()
    percentile_50 = models.FloatField()
    percentile_75 = models.FloatField()
    percentile_90 = models.FloatField()

class Segment(models.Model):
    _id = models.ObjectIdField(primary_key=True)
    start_index = models.IntegerField()
    end_index = models.IntegerField()
    label = models.CharField(max_length=50)
    features = models.ArrayModelField(model_container=SegmentFeature)


class TrajectorySegmentation(models.Model):
    _id = models.ObjectIdField(primary_key=True)
    trajectory = models.ForeignKey(to=management_models.Trajectory, on_delete=models.DO_NOTHING)
    segmentation = models.ArrayModelField(model_container=Segment)
    start_time = models.DateTimeField(null=True,blank=True)
    end_time = models.DateTimeField(null=True,blank=True)
    user = models.ForeignKey(to=User, on_delete=models.DO_NOTHING)


