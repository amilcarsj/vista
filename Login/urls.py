from django.urls import path
from Login import views

urlpatterns = [
    path('login/', views.login),
    path('register/', views.register),
    path('logout/', views.logout),
    path('', views.index)
]
