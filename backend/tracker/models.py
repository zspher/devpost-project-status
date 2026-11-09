from django.db import models


class Status(models.TextChoices):
    NO_LINK = "no_link"
    NO_ACCESS = "no_access"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"


class Commit(models.Model):
    date = models.DateTimeField()
    hash = models.CharField(max_length=40, unique=True)

    def __str__(self):
        return self.hash[:8]


class Project(models.Model):
    name = models.CharField(max_length=255)
    git_url = models.URLField()
    lines_of_code = models.PositiveIntegerField(null=True, blank=True)
    total_commits = models.PositiveIntegerField(null=True, blank=True)
    last_commit = models.ForeignKey(
        Commit, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    first_commit = models.ForeignKey(
        Commit, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    second_commit = models.ForeignKey(
        Commit, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NO_LINK
    )

    def __str__(self):
        return self.name
