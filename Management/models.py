from djongo import models
from django.contrib.auth.models import User



class Database(models.Model):
    _id = models.ObjectIdField(primary_key=True)
    tagging_session_manager = models.ForeignKey(to=User, on_delete=models.CASCADE)
    name = models.CharField(max_length=30)
    taggers = models.ArrayReferenceField(to=User, related_name='taggers', on_delete=models.DO_NOTHING)
    labels = models.ListField()


class Trajectory(models.Model):
    _id = models.ObjectIdField(primary_key=True)
    geojson = models.DictField()
    times = models.ListField()
    total_points = models.IntegerField()
    average_sampling = models.FloatField()
    db = models.ForeignKey(Database, on_delete=models.CASCADE)
    total_distance_traveled = models.FloatField()


class TrajectoryFeature(models.Model):
    _id = models.ObjectIdField(primary_key=True)
    name = models.CharField(max_length=20)
    values = models.ListField()
    trajectory = models.ForeignKey(to=Trajectory, on_delete=models.CASCADE)
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


class Session(models.Model):
    _id = models.ObjectIdField(primary_key=True)

poi_choices = (
    ('POI','POI'),
    ('ROI','ROI'),
)

class POI_ROI(models.Model):
    POI = 'POI'
    ROI = 'ROI'
    _id = models.ObjectIdField(primary_key=True)
    db = models.ForeignKey(Database, on_delete=models.CASCADE)
    geojson = models.DictField()
    name = models.CharField(max_length=30)
    type = models.CharField(choices=poi_choices, max_length=3)

