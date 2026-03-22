from django.urls import path

from .views import TriggerListCreateView

urlpatterns = [
    path("", TriggerListCreateView.as_view()),
]
