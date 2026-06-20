"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { Modal } from "@/components/ui/modal";
import {
  TableSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  useCreateService,
  useDeleteService,
  useServices,
  useUpdateService,
  useUpdateServiceStatus
} from "@/features/services/hooks/use-services";
import { ServiceForm } from "./service-form";

function formatPrice(service) {
  if (service.priceCents === null || service.priceCents === undefined) {
    return "Free";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: service.currency || "usd"
  }).format(service.priceCents / 100);
}

export function ServiceManagement({
  businessId,
  businessCurrency = "usd",
  isReadOnly = false
}) {
  const { showToast } = useToast();
  const [mode, setMode] = useState("list");
  const [selectedService, setSelectedService] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);

  const servicesQuery = useServices(businessId);
  const createMutation = useCreateService(businessId);
  const updateMutation = useUpdateService(businessId);
  const deleteMutation = useDeleteService(businessId);
  const statusMutation = useUpdateServiceStatus(businessId);
  const showServicesSkeleton = useDelayedVisibility(servicesQuery.isLoading);

  const services = useMemo(() => servicesQuery.data?.services || [], [servicesQuery.data?.services]);
  const summary = servicesQuery.data?.summary;
  const activeCount = summary?.active ?? services.filter((service) => service.isActive).length;
  const inactiveCount = summary?.inactive ?? Math.max(services.length - activeCount, 0);
  const effectiveReadOnly = isReadOnly || summary?.isReadOnly === true;
  const serviceLimitLabel =
    summary?.serviceLimit === null
      ? "Unlimited services"
      : summary?.serviceLimit
        ? `${services.length}/${summary.serviceLimit} services used`
        : "Service limit unavailable";
  const canCreateService =
    !effectiveReadOnly &&
    !servicesQuery.isLoading &&
    !servicesQuery.isError &&
    summary?.canCreate === true;

  async function handleCreate(values, helpers) {
    const result = await createMutation.mutateAsync(values);
    showToast({ title: result.message, variant: "success" });
    helpers.resetForm();
    setMode("list");
  }

  async function handleUpdate(values) {
    const result = await updateMutation.mutateAsync({
      serviceId: selectedService.id,
      values
    });
    showToast({ title: result.message, variant: "success" });
    setSelectedService(null);
    setMode("list");
  }

  function closeServiceForm() {
    setSelectedService(null);
    setMode("list");
  }

  async function handleDelete() {
    if (!serviceToDelete) {
      return;
    }

    try {
      const result = await deleteMutation.mutateAsync(serviceToDelete.id);
      setServiceToDelete(null);
      showToast({ title: result.message, variant: "success" });
    } catch (error) {
      setServiceToDelete(null);
      setActionError({
        description: "We could not delete this service. Services with existing bookings usually need to be archived or deactivated instead.",
        details: error.message,
        title: "Delete service failed"
      });
    }
  }

  async function handleStatus(service) {
    try {
      const result = await statusMutation.mutateAsync({
        serviceId: service.id,
        isActive: !service.isActive
      });
      showToast({ title: result.message, variant: "success" });
    } catch (error) {
      setActionError({
        description: "We could not update this service status. Please try again.",
        details: error.message,
        title: "Service update failed"
      });
    }
  }

  return (
    <div className="space-y-5">
      <ErrorDialog
        description={actionError?.description}
        details={actionError?.details}
        open={Boolean(actionError)}
        title={actionError?.title}
        onOpenChange={(open) => {
          if (!open) {
            setActionError(null);
          }
        }}
      />

      <ConfirmationDialog
        confirmLabel="Delete service"
        description={
          serviceToDelete
            ? `This permanently deletes "${serviceToDelete.name}" if it has no bookings. This action cannot be undone.`
            : ""
        }
        isLoading={deleteMutation.isPending}
        loadingLabel="Deleting..."
        open={Boolean(serviceToDelete)}
        title="Delete service?"
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open) {
            setServiceToDelete(null);
          }
        }}
      />

      <Modal
        description={
          mode === "edit"
            ? "Update the customer-facing details, duration, pricing, and operational buffers for this service."
            : "Create a bookable service with pricing, duration, payment, and scheduling defaults."
        }
        isDismissDisabled={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            closeServiceForm();
          }
        }}
        open={mode === "create" || (mode === "edit" && Boolean(selectedService))}
        size="lg"
        title={mode === "edit" ? "Edit service" : "Create service"}
      >
        <ServiceForm
          businessCurrency={businessCurrency}
          mode={mode === "edit" ? "edit" : "create"}
          service={mode === "edit" ? selectedService : null}
          onCancel={closeServiceForm}
          onSubmit={mode === "edit" ? handleUpdate : handleCreate}
        />
      </Modal>

      {servicesQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {servicesQuery.error.message}
        </div>
      ) : null}

      {effectiveReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. Services are available in read-only mode.
        </div>
      ) : null}

      {summary && !summary.canCreate && !summary.isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {summary.subscriptionEntitled
            ? "Your current plan has reached its service limit. Upgrade or delete unused services before creating more."
            : "An active subscription is required before creating services."}
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-3">
          <Badge>{serviceLimitLabel}</Badge>
          <Badge variant="success">{activeCount} active</Badge>
          <Badge variant="outline">{inactiveCount} inactive</Badge>
          {summary?.planCode ? <Badge variant="warning">{summary.planCode} plan</Badge> : null}
        </div>
        <Button disabled={!canCreateService} onClick={() => setMode("create")}>
          Create service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          {servicesQuery.isLoading ? (
            showServicesSkeleton ? (
              <TableSkeleton columns={6} rows={5} minWidth="760px" />
            ) : (
              <div className="min-h-56" role="status" aria-label="Loading services" />
            )
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-growth-border bg-growth-dashboard p-8 text-center">
              <h3 className="text-lg font-bold text-growth-sidebar">No services yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first bookable service to start building the public booking flow.
              </p>
              <Button
                className="mt-5"
                disabled={!canCreateService}
                onClick={() => setMode("create")}
              >
                Create first service
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-growth-border">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-growth-mint/50 text-growth-sidebar">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Duration</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Payment</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-growth-border bg-white">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-growth-mint/20">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-growth-sidebar">{service.name}</div>
                        <div className="text-xs text-muted-foreground">/{service.slug}</div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{service.durationMin} min</td>
                      <td className="px-4 py-4 text-muted-foreground">{formatPrice(service)}</td>
                      <td className="px-4 py-4">
                        <Badge variant={service.requiresPayment ? "warning" : "outline"}>
                          {service.requiresPayment ? "Required" : "Optional"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={service.isActive ? "success" : "outline"}>
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            disabled={effectiveReadOnly}
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedService(service);
                              setMode("edit");
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            disabled={
                              effectiveReadOnly ||
                              statusMutation.isPending ||
                              (!service.isActive && summary?.canActivate !== true)
                            }
                            onClick={() => handleStatus(service)}
                          >
                            {service.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="destructive"
                            disabled={effectiveReadOnly || deleteMutation.isPending}
                            onClick={() => setServiceToDelete(service)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
