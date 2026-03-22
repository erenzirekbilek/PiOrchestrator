from django.db import models


class Pin(models.Model):
    """GPIO pin / channel tracked by the scheduler."""

    bcm = models.PositiveIntegerField(help_text="BCM pin number")
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    is_reserved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["bcm"]
        constraints = [
            models.UniqueConstraint(fields=["bcm"], name="pins_pin_bcm_unique"),
        ]

    def __str__(self):
        return f"{self.name} (BCM {self.bcm})"
