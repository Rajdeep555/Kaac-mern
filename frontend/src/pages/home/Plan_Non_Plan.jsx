// src/pages/PlanNonPlan/Plan_Non_Plan.jsx
import { useEffect, useState, useCallback } from "react";
import DataTable from "../../components/DataTable/DataTable.jsx";
import TableButton from "../../components/ui/TableButton.jsx";
import FormOne from "../../components/Forms/FormOne.jsx";
import {
  createPlanNonPlan,
  getAllPlanNonPlan,
  updatePlanNonPlan,
  deletePlanNonPlan,
} from "../../api/planNonPlan.api.js";
import { Loader } from "../../components/ui/Loader.jsx";
import { showToast } from "../../utils/toast.js";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdRestore } from "react-icons/md";
import AlertModal from "../../components/ui/AlertModal.jsx";

const Plan_Non_Plan = () => {
  const [planNonPlan, setPlanNonPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingPlanNonPlan, setEditingPlanNonPlan] = useState(null);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    id: null,
    isActive: false,
  });

  useEffect(() => {
    fetchPlanNonPlan();
  }, []);

  const fetchPlanNonPlan = async () => {
    try {
      setLoading(true);
      const res = await getAllPlanNonPlan();
      setPlanNonPlan(res.data.planNonPlans);
    } catch (error) {
      console.error("Error fetching Plan/Non-Plan:", error);
      showToast("Failed to load Plan / Non-Plan", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrReactivate = useCallback(async (id, isActive) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));

    try {
      await deletePlanNonPlan(id);

      setPlanNonPlan((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isActive: !isActive } : item,
        ),
      );

      showToast(
        isActive ? "Deactivated successfully!" : "Reactivated successfully!",
        "success",
      );

      setAlertModal((prev) => ({ ...prev, open: false }));
    } catch (error) {
      showToast("Operation failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const handleEdit = (row) => {
    setEditingPlanNonPlan(row);
    setIsModalOpen(true);
    setFormError("");
  };

  const openAlertModal = (id, isActive) => {
    setAlertModal({
      open: true,
      title: isActive ? "Deactivate Plan?" : "Reactivate Plan?",
      message: isActive
        ? "This plan will be marked inactive."
        : "This plan will be reactivated.",
      onConfirm: () => handleDeleteOrReactivate(id, isActive),
      id,
      isActive,
    });
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "sector", label: "Sector" },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const isLoading = actionLoading[row.id];
        const isActive = row.isActive;

        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row)}
              disabled={isLoading}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded">
              <AiFillEdit className="w-4 h-4" />
            </button>

            <button
              onClick={() => openAlertModal(row.id, isActive)}
              disabled={isLoading}
              className={`p-1.5 rounded ${
                isActive
                  ? "text-red-600 hover:bg-red-100"
                  : "text-green-600 hover:bg-green-100"
              }`}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isActive ? (
                <MdDelete className="w-4 h-4" />
              ) : (
                <MdRestore className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  const formFields = [
    {
      name: "name",
      label: "Plan / Non-Plan Name",
      type: "text",
      placeholder: "Enter name",
      required: true,
    },
    {
      name: "sector",
      label: "Sector",
      type: "select",
      options: [
        { label: "COUNCIL", value: "COUNCIL" },
        { label: "STATE", value: "STATE" },
      ],
      readonly: !!editingPlanNonPlan,
    },
  ];

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");

    try {
      const payload = {
        ...formData,
        sector: editingPlanNonPlan
          ? editingPlanNonPlan.sector
          : formData.sector,
        isActive: true,
      };

      let res;

      if (editingPlanNonPlan) {
        res = await updatePlanNonPlan(editingPlanNonPlan.id, payload);
        setPlanNonPlan((prev) =>
          prev.map((p) =>
            p.id === editingPlanNonPlan.id ? res.data.planNonPlan : p,
          ),
        );
        showToast("Updated successfully!", "success");
      } else {
        res = await createPlanNonPlan(payload);
        setPlanNonPlan((prev) => [...prev, res.data.planNonPlan]);
        showToast("Added successfully!", "success");
      }

      setIsModalOpen(false);
      setEditingPlanNonPlan(null);
    } catch (error) {
      const msg = error?.response?.data?.message || "Operation failed";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl">Plan / Non-Plan Management</h1>

        {loading ? (
          <Loader />
        ) : (
          <DataTable
            data={planNonPlan}
            columns={columns}
            searchableKeys={["name", "sector"]}
            statusKey="isActive"
            pageSize={10}
            downloadFileName="plan-non-plan"
            printTitle="Plan / Non-Plan Report"
            actionSlot={
              <TableButton
                name="Add New Plan"
                onClick={() => {
                  setEditingPlanNonPlan(null);
                  setFormError("");
                  setIsModalOpen(true);
                }}
              />
            }
          />
        )}
      </div>

      {isModalOpen && (
        <FormOne
          isOpen={isModalOpen}
          fields={formFields}
          initialValues={editingPlanNonPlan}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
            setEditingPlanNonPlan(null);
          }}
          title={editingPlanNonPlan ? "Edit Plan / Non-Plan" : "Add New Plan"}
          loading={saving}
          error={formError}
          onSubmit={handleSubmit}
        />
      )}

      <AlertModal
        isOpen={alertModal.open}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
        onConfirm={alertModal.onConfirm}
        title={alertModal.title}
        message={alertModal.message}
        confirmText={alertModal.isActive ? "Deactivate" : "Reactivate"}
        loading={actionLoading[alertModal.id]}
      />
    </>
  );
};

export default Plan_Non_Plan;
