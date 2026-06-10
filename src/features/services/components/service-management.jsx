"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [mode, setMode] = useState("list");
  const [selectedService, setSelectedService] = useState(null);
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const servicesQuery = useServices(businessId);
  const createMutation = useCreateService(businessId);
  const updateMutation = useUpdateService(businessId);
  const deleteMutation = useDeleteService(businessId);
  const statusMutation = useUpdateServiceStatus(businessId);

  const services = useMemo(() => servicesQuery.data?.services || [], [servicesQuery.data?.services]);
  const summary = servicesQuery.data?.summary;
  const activeCount = summary?.active ?? services.filter((service) => service.isActive).length;
  const inactiveCount = summary?.inactive ?? Math.max(services.length - activeCount, 0);
  const serviceLimitLabel =
    summary?.serviceLimit === null
      ? "Unlimited services"
      : summary?.serviceLimit
        ? `${services.length}/${summary.serviceLimit} services used`
        : "Service limit unavailable";
  const canCreateService = !isReadOnly && !servicesQuery.isLoading && summary?.canCreate !== false;

  async function handleCreate(values, helpers) {
    setErrorMessage(null);
    const result = await createMutation.mutateAsync(values);
    setMessage(result.message);
    helpers.resetForm();
    setMode("list");
  }

  async function handleUpdate(values) {
    setErrorMessage(null);
    const result = await updateMutation.mutateAsync({
      serviceId: selectedService.id,
      values
    });
    setMessage(result.message);
    setSelectedService(null);
    setMode("list");
  }

  async function handleDelete(service) {
    const confirmed = window.confirm(`Delete "${service.name}"? This only works if the service has no bookings.`);

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage(null);
      const result = await deleteMutation.mutateAsync(service.id);
      setMessage(result.message);
    } catch (error) {
      setErrorMessage(error.message || "Could not delete service.");
    }
  }

  async function handleStatus(service) {
    try {
      setErrorMessage(null);
      const result = await statusMutation.mutateAsync({
        serviceId: service.id,
        isActive: !service.isActive
      });
      setMessage(result.message);
    } catch (error) {
      setErrorMessage(error.message || "Could not update service status.");
    }
  }

  if (mode === "create") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create service</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm businessCurrency={businessCurrency} onCancel={() => setMode("list")} onSubmit={handleCreate} />
        </CardContent>
      </Card>
    );
  }

  if (mode === "edit" && selectedService) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit service</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm
            businessCurrency={businessCurrency}
            mode="edit"
            service={selectedService}
            onCancel={() => {
              setSelectedService(null);
              setMode("list");
            }}
            onSubmit={handleUpdate}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-growth-border bg-growth-mint/40 px-4 py-3 text-sm font-medium text-growth-sidebar">
          {message}
        </div>
      ) : null}

      {servicesQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {servicesQuery.error.message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {isReadOnly ? (
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
            <p className="text-sm text-muted-foreground">Loading services...</p>
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
            <div className="overflow-hidden rounded-2xl border border-growth-border">
              <table className="w-full border-collapse text-left text-sm">
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
                            disabled={isReadOnly}
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
                            disabled={isReadOnly || statusMutation.isPending}
                            onClick={() => handleStatus(service)}
                          >
                            {service.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="destructive"
                            disabled={isReadOnly || deleteMutation.isPending}
                            onClick={() => handleDelete(service)}
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
