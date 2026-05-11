import { useEffect, useState, useCallback } from "react";
import { Loader } from "../../components/ui/Loader";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import FormOne from "../../components/Forms/FormOne.jsx";
import AlertModal from "../../components/ui/AlertModal.jsx";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdRestore } from "react-icons/md";
import {
  createHead,
  getHeads,
  updateHead,
  deleteHead,
} from "../../api/head.api.js";
import { showToast } from "../../utils/toast.js";

const Council = () => {
  const [loading, setLoading] = useState(true);
  const [heads, setHeads] = useState([]);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [formError, setFormError] = useState("");
  const [editingHead, setEditingHead] = useState(null);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    headId: null,
    isActive: null,
  });

  useEffect(() => {
    fetchHeads();
  }, []);

  const formatHead = (code, name) => (code && name ? `${code} - ${name}` : "");

  const applyDisplayFields = (h) => ({
    ...h,
    majorHeadDisplay: formatHead(h.majorHeadCode, h.majorHead),
    subMajorDisplay: formatHead(h.subMajorCode, h.subMajor),
    minorHeadDisplay: formatHead(h.minorHeadCode, h.minorHead),
    subHeadDisplay: formatHead(h.subHeadCode, h.subHead),
    subSubHeadDisplay: formatHead(h.subSubHeadCode, h.subSubHead),
    detailHeadDisplay: formatHead(h.detailHeadCode, h.detailHead),
    subDetailHeadDisplay: formatHead(h.subDetailHeadCode, h.subDetailHead),
  });

  const fetchHeads = async () => {
    try {
      setLoading(true);
      const res = await getHeads("COUNCIL");
      setHeads(res.data.heads.map(applyDisplayFields));
    } catch (error) {
      showToast("Failed to load heads", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setEditingHead(row);
    setFormError("");
    setIsModalOpen(true);
  };

  const openAlertModal = (headId, isActive) => {
    setAlertModal({
      open: true,
      title: isActive ? "Deactivate Head?" : "Reactivate Head?",
      message: isActive
        ? "This head will be marked as inactive."
        : "This head will be reactivated.",
      onConfirm: () => handleToggleStatus(headId, isActive),
      headId,
      isActive,
    });
  };

  const handleToggleStatus = useCallback(async (headId, isActive) => {
    setActionLoading((prev) => ({ ...prev, [headId]: true }));
    try {
      await deleteHead(headId);
      setHeads((prev) =>
        prev.map((h) => (h.id === headId ? { ...h, isActive: !isActive } : h)),
      );
      showToast(
        isActive ? "Head deactivated!" : "Head reactivated!",
        "success",
      );
      setAlertModal((prev) => ({ ...prev, open: false }));
    } catch (error) {
      showToast("Operation failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [headId]: false }));
    }
  }, []);

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");
    const payload = { ...formData, sector: "COUNCIL" };

    try {
      let res;
      if (editingHead) {
        res = await updateHead(editingHead.id, payload);
        // ✅ FIX: re-apply display fields after update + use res.data.head (singular)
        const updated = applyDisplayFields(res.data.head);
        setHeads((prev) =>
          prev.map((h) => (h.id === editingHead.id ? updated : h)),
        );
        showToast("Head updated successfully!", "success");
      } else {
        res = await createHead(payload);
        // ✅ FIX: re-apply display fields on new item
        const newHead = applyDisplayFields(res.data.head);
        setHeads((prev) => [...prev, newHead]);
        showToast("Head added successfully!", "success");
      }

      setIsModalOpen(false);
      setEditingHead(null);
    } catch (error) {
      const errMsg = error?.response?.data?.message || error.message;
      setFormError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "majorHeadDisplay", label: "Major Head" },
    { key: "subMajorDisplay", label: "Sub Major" },
    { key: "minorHeadDisplay", label: "Minor Head" },
    { key: "subHeadDisplay", label: "Sub Head" },
    { key: "subSubHeadDisplay", label: "Sub Sub Head" },
    { key: "detailHeadDisplay", label: "Detail Head" },
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
      // ✅ FIX: was missing render — buttons were never shown
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
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
              title="Edit">
              <AiFillEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => openAlertModal(row.id, isActive)}
              disabled={isLoading}
              className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                isActive
                  ? "text-red-600 hover:bg-red-100"
                  : "text-green-600 hover:bg-green-100"
              }`}
              title={isActive ? "Deactivate" : "Reactivate"}>
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

  const headFormFields = [
    {
      name: "grantName",
      label: "Grant Name",
      type: "text",
      placeholder: "Enter Grant Name",
    },
    {
      name: "grantNo",
      label: "Grant No",
      type: "text",
      placeholder: "Eg. 9980",
    },
    {
      name: "majorHead",
      label: "Major Head",
      type: "text",
      placeholder: "Enter Major Head",
    },
    {
      name: "majorHeadCode",
      label: "Major Head Code",
      type: "text",
      placeholder: "Eg. 9980",
    },
    {
      name: "subMajor",
      label: "Sub Major",
      type: "text",
      placeholder: "Enter Sub Major",
    },
    {
      name: "subMajorCode",
      label: "Sub Major Code",
      type: "text",
      placeholder: "Eg. 9980",
    },
    {
      name: "minorHead",
      label: "Minor Head",
      type: "text",
      placeholder: "Enter Minor Head",
    },
    {
      name: "minorHeadCode",
      label: "Minor Head Code",
      type: "text",
      placeholder: "Eg. 9980",
    },
    {
      name: "subHead",
      label: "Sub Head",
      type: "text",
      placeholder: "Enter Sub Head",
    },
    {
      name: "subHeadCode",
      label: "Sub Head Code",
      type: "text",
      placeholder: "Eg. 9980",
    },
    {
      name: "subSubHead",
      label: "Sub Sub Head",
      type: "text",
      placeholder: "Enter Sub Sub Head",
    },
    {
      name: "subSubHeadCode",
      label: "Sub Sub Head Code",
      type: "text",
      placeholder: "Eg. 9980",
    },
    {
      name: "detailHead",
      label: "Detail Head",
      type: "text",
      placeholder: "Enter Detail Head",
    },
    {
      name: "detailHeadCode",
      label: "Detail Head Code",
      type: "text",
      placeholder: "Eg. 9980",
    },
    {
      name: "subDetailHead",
      label: "Sub Detail Head",
      type: "text",
      placeholder: "Enter Sub Detail Head",
    },
    {
      name: "subDetailHeadCode",
      label: "Sub Detail Head Code",
      type: "text",
      placeholder: "Eg. 9980",
    },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        <h1 className="font-unbounded text-3xl">Council Head Management</h1>

        {loading ? (
          <Loader />
        ) : (
          <DataTable
            columns={columns}
            data={heads}
            pageSize={50}
            searchableKeys={[
              "majorHead",
              "majorHeadCode",
              "majorHeadDisplay",
              "subMajor",
              "subMajorCode",
              "subMajorDisplay",
              "minorHead",
              "minorHeadCode",
              "minorHeadDisplay",
            ]}
            statusKey="isActive"
            loading={loading}
            downloadFileName="council-heads"
            printTitle="Council Head Report"
            actionSlot={
              <TableButton
                name="Add New Head"
                onClick={() => {
                  setEditingHead(null);
                  setFormError("");
                  setIsModalOpen(true);
                }}
              />
            }
          />
        )}
      </div>

      {/* ✅ Responsive modal with overflow-y-auto so long form scrolls */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 pt-6 pb-4 border-b">
              <h2 className="text-xl font-semibold">
                {editingHead ? "Edit Head" : "Add New Head"}
              </h2>
            </div>

            {/* ✅ Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <FormOne
                isOpen={isModalOpen}
                fields={headFormFields}
                initialValues={editingHead}
                onClose={() => {
                  setFormError("");
                  setIsModalOpen(false);
                  setEditingHead(null);
                }}
                title={editingHead ? "Edit Head" : "Add New Head"}
                loading={saving}
                error={formError}
                onSubmit={handleSubmit}
                // Pass hideTitle so FormOne doesn't render a duplicate title
                hideTitle
              />
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertModal.open}
        onClose={() => setAlertModal((prev) => ({ ...prev, open: false }))}
        onConfirm={alertModal.onConfirm}
        title={alertModal.title}
        message={alertModal.message}
        confirmText={alertModal.isActive ? "Deactivate" : "Reactivate"}
        loading={actionLoading[alertModal.headId]}
      />
    </>
  );
};

export default Council;
