from django.urls import path

from .views import DeviceCommandView, DeviceStatusView, DeviceTimeView

urlpatterns = [
    path("command/", DeviceCommandView.as_view()),
    path("time/", DeviceTimeView.as_view()),
    path("", DeviceStatusView.as_view()),
]
