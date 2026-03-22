from django.db import models


class Trigger(models.Model):
    sequence = models.ForeignKey(
        "sequences.Sequence",
        on_delete=models.CASCADE,
        related_name="triggers",
    )
    name = models.CharField(max_length=255, blank=True)
    schedule = models.CharField(
        max_length=255,
        blank=True,
        help_text="Schedule hint (e.g. cron expression or label).",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name or f"Trigger #{self.pk}"
