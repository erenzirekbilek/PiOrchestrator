from django.db import models


class Sequence(models.Model):
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    is_running = models.BooleanField(default=False)
    length_seconds = models.PositiveIntegerField(default=60)
    step_seconds = models.PositiveIntegerField(default=1)
    channels = models.JSONField(default=list)
    last_run = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
