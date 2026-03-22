from django.urls import path

from .views import (
    SequenceCopyView,
    SequenceDetailView,
    SequenceListCreateView,
    SequenceRunView,
    SequenceStopView,
)

urlpatterns = [
    path("<int:pk>/run/", SequenceRunView.as_view()),
    path("<int:pk>/stop/", SequenceStopView.as_view()),
    path("<int:pk>/copy/", SequenceCopyView.as_view()),
    path("<int:pk>/", SequenceDetailView.as_view()),
    path("", SequenceListCreateView.as_view()),
]
