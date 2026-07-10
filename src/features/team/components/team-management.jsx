"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { ActionErrorDialog } from "@/components/ui/action-error-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  CardListSkeleton,
  MetricCardsSkeleton,
  Skeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { DAYS_OF_WEEK } from "@/features/availability/constants";
import {
  useInviteTeamMember,
  useRemoveTeamMember,
  useRevokeTeamInvitation,
  useTeam,
  useUpdateTeamMemberAvailability,
  useUpdateTeamMemberRole,
  useUpdateTeamMemberServices
} from "@/features/team/hooks/use-team";
import { teamInvitationSchema } from "@/features/team/validation/team-schema";

function dateLabel(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function TeamMemberEditor({
  businessId,
  canManage,
  member,
  services,
  onActionError
}) {
  const { showToast } = useToast();
  const [role, setRole] = useState(member.role);
  const [serviceIds, setServiceIds] = useState(
    member.serviceAssignments.map((assignment) => assignment.serviceId)
  );
  const [availability, setAvailability] = useState(member.availability);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const roleMutation = useUpdateTeamMemberRole(businessId);
  const servicesMutation = useUpdateTeamMemberServices(businessId);
  const availabilityMutation = useUpdateTeamMemberAvailability(businessId);
  const removeMutation = useRemoveTeamMember(businessId);

  async function run(action) {
    try {
      const result = await action();
      showToast({ title: result.message, variant: "success" });
    } catch (error) {
      onActionError({
        description: "We could not save this team member update. Please review the details and try again.",
        details: error.message,
        title: "Team update failed"
      });
    }
  }

  async function removeTeamMember() {
    try {
      const result = await removeMutation.mutateAsync(member.id);
      setRemoveDialogOpen(false);
      showToast({ title: result.message, variant: "success" });
    } catch (error) {
      onActionError({
        description: "We could not remove this team member. Check whether they still own active work and try again.",
        details: error.message,
        title: "Remove team member failed"
      });
    }
  }

  function updateAvailability(index, field, value) {
    setAvailability((current) =>
      current.map((window, windowIndex) =>
        windowIndex === index ? { ...window, [field]: value } : window
      )
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <CardTitle>{member.user.name || member.user.email}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {member.user.email} | Joined {dateLabel(member.joinedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={member.role === "ADMIN" ? "warning" : "outline"}>
              {member.role}
            </Badge>
            <Badge>{member._count.assignedBookings} bookings</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <Label htmlFor={`role-${member.id}`}>Business role</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              className="h-11 flex-1 rounded-2xl border border-input bg-white px-4 text-sm"
              disabled={!canManage}
              id={`role-${member.id}`}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </Select>
            {canManage ? (
              <Button
                disabled={roleMutation.isPending || role === member.role}
                isLoading={roleMutation.isPending}
                loadingLabel="Saving..."
                variant="outline"
                onClick={() =>
                  run(() =>
                    roleMutation.mutateAsync({
                      membershipId: member.id,
                      role
                    })
                  )
                }
              >
                Save role
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Admins can manage operational records. Only the owner can manage
            team membership and assignments.
          </p>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-growth-sidebar">
              Service eligibility
            </p>
            <p className="text-xs text-muted-foreground">
              A booking can only be assigned after its service is selected
              here.
            </p>
          </div>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create a service before assigning staff capabilities.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <label
                  className="flex items-center gap-3 rounded-2xl border border-growth-border bg-growth-dashboard px-4 py-3 text-sm"
                  key={service.id}
                >
                  <Checkbox
                    checked={serviceIds.includes(service.id)}
                    disabled={!canManage}
                    onChange={(event) =>
                      setServiceIds((current) =>
                        event.target.checked
                          ? [...current, service.id]
                          : current.filter((id) => id !== service.id)
                      )
                    }
                  />
                  <span className="font-medium text-growth-sidebar">
                    {service.name}
                  </span>
                  {!service.isActive ? (
                    <Badge variant="outline">Inactive</Badge>
                  ) : null}
                </label>
              ))}
            </div>
          )}
          {canManage ? (
            <Button
              disabled={servicesMutation.isPending}
              isLoading={servicesMutation.isPending}
              loadingLabel="Saving..."
              size="sm"
              variant="outline"
              onClick={() =>
                run(() =>
                  servicesMutation.mutateAsync({
                    membershipId: member.id,
                    serviceIds
                  })
                )
              }
            >
              Save services
            </Button>
          ) : null}
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-growth-sidebar">
              Working hours
            </p>
            <p className="text-xs text-muted-foreground">
              These hours support team planning. Public slot capacity remains
              business-level in this milestone.
            </p>
          </div>
          {availability.length === 0 ? (
            <p className="rounded-2xl bg-growth-dashboard p-4 text-sm text-muted-foreground">
              No team working hours configured.
            </p>
          ) : (
            <div className="space-y-2">
              {availability.map((window, index) => (
                <div
                  className="grid gap-2 rounded-2xl border border-growth-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                  key={`${member.id}-${index}`}
                >
                  <Select
                    className="h-11 rounded-2xl border border-input bg-white px-3 text-sm"
                    disabled={!canManage}
                    value={window.dayOfWeek}
                    onChange={(event) =>
                      updateAvailability(index, "dayOfWeek", event.target.value)
                    }
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    disabled={!canManage}
                    type="time"
                    value={window.startTime}
                    onChange={(event) =>
                      updateAvailability(index, "startTime", event.target.value)
                    }
                  />
                  <Input
                    disabled={!canManage}
                    type="time"
                    value={window.endTime}
                    onChange={(event) =>
                      updateAvailability(index, "endTime", event.target.value)
                    }
                  />
                  {canManage ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setAvailability((current) =>
                          current.filter(
                            (_window, windowIndex) => windowIndex !== index
                          )
                        )
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setAvailability((current) => [
                    ...current,
                    {
                      dayOfWeek: "MONDAY",
                      startTime: "09:00",
                      endTime: "17:00",
                      isActive: true
                    }
                  ])
                }
              >
                Add hours
              </Button>
              <Button
                disabled={availabilityMutation.isPending}
                isLoading={availabilityMutation.isPending}
                loadingLabel="Saving..."
                size="sm"
                onClick={() =>
                  run(() =>
                    availabilityMutation.mutateAsync({
                      membershipId: member.id,
                      availability
                    })
                  )
                }
              >
                Save working hours
              </Button>
            </div>
          ) : null}
        </section>

        {canManage ? (
          <div className="border-t border-growth-border pt-4">
            <Button
              disabled={removeMutation.isPending}
              isLoading={removeMutation.isPending}
              loadingLabel="Removing..."
              size="sm"
              variant="destructive"
              onClick={() => setRemoveDialogOpen(true)}
            >
              Remove team member
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
    <ConfirmationDialog
      confirmLabel="Remove member"
      description={`This removes ${member.user.name || member.user.email} from the team and revokes their operational access.`}
      isLoading={removeMutation.isPending}
      loadingLabel="Removing..."
      open={removeDialogOpen}
      title="Remove team member?"
      onConfirm={removeTeamMember}
      onOpenChange={setRemoveDialogOpen}
    />
    </>
  );
}

export function TeamManagement({ businessId }) {
  const { showToast } = useToast();
  const teamQuery = useTeam(businessId);
  const inviteMutation = useInviteTeamMember(businessId);
  const revokeMutation = useRevokeTeamInvitation(businessId);
  const [actionError, setActionError] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [invitationToRevoke, setInvitationToRevoke] = useState(null);
  const showTeamSkeleton = useDelayedVisibility(teamQuery.isLoading);
  const team = teamQuery.data;
  const members = useMemo(() => team?.members || [], [team?.members]);
  const invitations = useMemo(
    () => team?.invitations || [],
    [team?.invitations]
  );
  const formik = useFormik({
    initialValues: {
      email: "",
      role: "STAFF"
    },
    validationSchema: teamInvitationSchema,
    onSubmit: async (values, helpers) => {
      try {
        const result = await inviteMutation.mutateAsync(values);
        helpers.resetForm();
        setInviteDialogOpen(false);
        showToast({ title: result.message, variant: "success" });
      } catch (actionError) {
        helpers.setErrors(actionError.details || {});
        setActionError({
          description: "We could not send this invitation. Check the recipient details and try again.",
          details: actionError.message,
          title: "Invitation failed"
        });
      }
    }
  });

  async function revokeInvitation() {
    if (!invitationToRevoke) {
      return;
    }

    try {
      const result = await revokeMutation.mutateAsync(invitationToRevoke.id);
      setInvitationToRevoke(null);
      showToast({ title: result.message, variant: "success" });
    } catch (actionError) {
      setActionError({
        description: "We could not revoke this invitation. Please try again.",
        details: actionError.message,
        title: "Invitation update failed"
      });
    }
  }

  if (teamQuery.isLoading) {
    if (!showTeamSkeleton) {
      return <div className="min-h-96" role="status" aria-label="Loading team workspace" />;
    }

    return (
      <div className="space-y-6" role="status" aria-label="Loading team workspace">
        <MetricCardsSkeleton count={3} className="xl:grid-cols-3" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-80 max-w-full" />
            </div>
            <Skeleton className="h-10 w-40 rounded-2xl" />
          </CardContent>
        </Card>
        <CardListSkeleton count={3} />
      </div>
    );
  }

  if (teamQuery.error) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-700">
          {teamQuery.error.message}
        </CardContent>
      </Card>
    );
  }

  const canManage = team.access.canWrite;
  const limitLabel =
    team.usage.limit === null
      ? `${team.usage.used} seats used | unlimited`
      : `${team.usage.used}/${team.usage.limit} seats used`;

  return (
    <div className="space-y-6">
      <ActionErrorDialog
        error={actionError}
        onClear={() => setActionError(null)}
      />
      {!team.access.canManage ? (
        <div className="rounded-2xl border border-growth-border bg-white px-4 py-3 text-sm text-muted-foreground">
          Team configuration is owner-only. Your roster and assignments are
          available in read-only mode.
        </div>
      ) : null}
      {team.access.canManage && !team.access.canWrite ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Team changes are blocked until the business is active with an
          entitled subscription.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Plan seats
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {limitLabel}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Active team
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {members.length + 1}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Pending invitations
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {invitations.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {team.access.canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Team invitations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-growth-sidebar">
                Invite a teammate by email
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                New members receive role-based access after accepting the invitation.
              </p>
              {!team.usage.hasCapacity ? (
                <p className="mt-3 text-sm text-amber-700">
                  The {team.usage.planCode} plan has no available team seats.
                </p>
              ) : null}
            </div>
            <Button
              disabled={!team.access.canInvite}
              onClick={() => setInviteDialogOpen(true)}
            >
              Invite team member
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Modal
        description="Send a role-based invitation to a teammate. The invitation can be revoked before it is accepted."
        isDismissDisabled={formik.isSubmitting}
        onOpenChange={(open) => {
          setInviteDialogOpen(open);

          if (!open) {
            formik.resetForm();
          }
        }}
        open={inviteDialogOpen}
        title="Invite team member"
      >
        <form className="space-y-4" onSubmit={formik.handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="team-email">Email</Label>
            <Input
              disabled={!team.access.canInvite}
              id="team-email"
              name="email"
              type="email"
              value={formik.values.email}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
            {formik.touched.email && formik.errors.email ? (
              <p className="text-xs text-red-600">{formik.errors.email}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-role">Role</Label>
            <Select
              className="h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm"
              disabled={!team.access.canInvite}
              id="team-role"
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              disabled={formik.isSubmitting}
              type="button"
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
            >
              Cancel
            </Button>
              <Button
                disabled={!team.access.canInvite}
                isLoading={formik.isSubmitting}
                loadingLabel="Sending..."
                type="submit"
              >
                Send invitation
              </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        confirmLabel="Revoke invitation"
        description={
          invitationToRevoke
            ? `This invitation for ${invitationToRevoke.email} will no longer be usable.`
            : ""
        }
        isLoading={revokeMutation.isPending}
        loadingLabel="Revoking..."
        open={Boolean(invitationToRevoke)}
        title="Revoke invitation?"
        onConfirm={revokeInvitation}
        onOpenChange={(open) => {
          if (!open) {
            setInvitationToRevoke(null);
          }
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Business owner</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-growth-sidebar">
              {team.owner.name || team.owner.email}
            </p>
            <p className="text-sm text-muted-foreground">{team.owner.email}</p>
          </div>
          <Badge variant="success">OWNER</Badge>
        </CardContent>
      </Card>

      {invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map((invitation) => (
              <div
                className="flex flex-col justify-between gap-3 rounded-2xl border border-growth-border p-4 sm:flex-row sm:items-center"
                key={invitation.id}
              >
                <div>
                  <p className="font-semibold text-growth-sidebar">
                    {invitation.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invitation.role} | Expires {dateLabel(invitation.expiresAt)}
                  </p>
                </div>
                {canManage ? (
                  <Button
                    disabled={revokeMutation.isPending}
                    size="sm"
                    variant="outline"
                    onClick={() => setInvitationToRevoke(invitation)}
                  >
                    Revoke
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-growth-sidebar">Team members</h2>
          <p className="text-sm text-muted-foreground">
            Manage roles, service eligibility, and operational working hours.
          </p>
        </div>
        {members.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No invited team members have joined yet.
            </CardContent>
          </Card>
        ) : (
          members.map((member) => (
            <TeamMemberEditor
              businessId={businessId}
              canManage={canManage}
              key={`${member.id}-${member.updatedAt}`}
              member={member}
              services={team.services}
              onActionError={setActionError}
            />
          ))
        )}
      </div>
    </div>
  );
}
