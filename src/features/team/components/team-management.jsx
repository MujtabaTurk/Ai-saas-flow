"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  onError,
  onMessage
}) {
  const [role, setRole] = useState(member.role);
  const [serviceIds, setServiceIds] = useState(
    member.serviceAssignments.map((assignment) => assignment.serviceId)
  );
  const [availability, setAvailability] = useState(member.availability);
  const roleMutation = useUpdateTeamMemberRole(businessId);
  const servicesMutation = useUpdateTeamMemberServices(businessId);
  const availabilityMutation = useUpdateTeamMemberAvailability(businessId);
  const removeMutation = useRemoveTeamMember(businessId);

  async function run(action) {
    try {
      const result = await action();
      onError(null);
      onMessage(result.message);
    } catch (error) {
      onMessage(null);
      onError(error.message);
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
            <select
              className="h-11 flex-1 rounded-2xl border border-input bg-white px-4 text-sm"
              disabled={!canManage}
              id={`role-${member.id}`}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
            {canManage ? (
              <Button
                disabled={roleMutation.isPending || role === member.role}
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
                  <input
                    checked={serviceIds.includes(service.id)}
                    disabled={!canManage}
                    type="checkbox"
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
                  <select
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
                  </select>
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
              size="sm"
              variant="destructive"
              onClick={() => {
                if (
                  window.confirm(
                    `Remove ${member.user.name || member.user.email} from the team?`
                  )
                ) {
                  run(() => removeMutation.mutateAsync(member.id));
                }
              }}
            >
              Remove team member
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function TeamManagement({ businessId }) {
  const teamQuery = useTeam(businessId);
  const inviteMutation = useInviteTeamMember(businessId);
  const revokeMutation = useRevokeTeamInvitation(businessId);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
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
        setError(null);
        setMessage(result.message);
      } catch (actionError) {
        setMessage(null);
        setError(actionError.message);
        helpers.setErrors(actionError.details || {});
      }
    }
  });

  async function revokeInvitation(invitation) {
    if (!window.confirm(`Revoke the invitation for ${invitation.email}?`)) {
      return;
    }

    try {
      const result = await revokeMutation.mutateAsync(invitation.id);
      setError(null);
      setMessage(result.message);
    } catch (actionError) {
      setMessage(null);
      setError(actionError.message);
    }
  }

  if (teamQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Loading team...
        </CardContent>
      </Card>
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
      {message ? (
        <div className="rounded-2xl border border-growth-border bg-growth-mint/40 px-4 py-3 text-sm text-growth-sidebar">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
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
            <CardTitle>Invite team member</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-[1fr_180px_auto]"
              onSubmit={formik.handleSubmit}
            >
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
                <select
                  className="h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm"
                  disabled={!team.access.canInvite}
                  id="team-role"
                  name="role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <Button
                className="md:mt-7"
                disabled={!team.access.canInvite || formik.isSubmitting}
                type="submit"
              >
                {formik.isSubmitting ? "Sending..." : "Send invitation"}
              </Button>
            </form>
            {!team.usage.hasCapacity ? (
              <p className="mt-3 text-sm text-amber-700">
                The {team.usage.planCode} plan has no available team seats.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
                    onClick={() => revokeInvitation(invitation)}
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
              onError={setError}
              onMessage={setMessage}
            />
          ))
        )}
      </div>
    </div>
  );
}
