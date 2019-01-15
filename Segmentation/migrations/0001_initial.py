# Generated by Django 2.1.5 on 2019-01-15 00:56

import Segmentation.models
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import djongo.models.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('Management', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Segment',
            fields=[
                ('_id', djongo.models.fields.ObjectIdField(auto_created=True, primary_key=True, serialize=False)),
                ('start_index', models.IntegerField()),
                ('end_index', models.IntegerField()),
                ('label', models.CharField(max_length=50)),
                ('features', djongo.models.fields.ArrayModelField(model_container=Segmentation.models.SegmentFeature)),
            ],
        ),
        migrations.CreateModel(
            name='SegmentFeature',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=20)),
                ('std', models.FloatField()),
                ('min', models.FloatField()),
                ('max', models.FloatField()),
                ('mean', models.FloatField()),
                ('median', models.FloatField()),
                ('percentile_10', models.FloatField()),
                ('percentile_25', models.FloatField()),
                ('percentile_50', models.FloatField()),
                ('percentile_75', models.FloatField()),
                ('percentile_90', models.FloatField()),
            ],
        ),
        migrations.CreateModel(
            name='TrajectorySegmentation',
            fields=[
                ('_id', djongo.models.fields.ObjectIdField(auto_created=True, primary_key=True, serialize=False)),
                ('segmentation', djongo.models.fields.ArrayModelField(model_container=Segmentation.models.Segment)),
                ('start_time', models.DateTimeField(blank=True, null=True)),
                ('end_time', models.DateTimeField(blank=True, null=True)),
                ('trajectory', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='Management.Trajectory')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
