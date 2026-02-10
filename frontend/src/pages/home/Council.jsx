import React, { useEffect, useState } from "react";
import { Loader } from "../../components/ui/Loader";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import FormOne from "../../components/Forms/FormOne.jsx";
import { handlePrint } from "../../utils/printUtils";
import { createHead, getHeads, updateHead } from "../../api/head.api.js";
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
  });

  useEffect(() => {
    fetchHeads();
  }, []);

  const formatHead = (code, name) => (code && name ? `${code} - ${name}` : "");
  const fetchHeads = async () => {
    try {
      setLoading(true);
      const res = await getHeads("COUNCIL");

      const formatted = res.data.heads.map((h) => ({
        ...h,

        majorHeadDisplay: formatHead(h.majorHeadCode, h.majorHead),
        subMajorDisplay: formatHead(h.subMajorCode, h.subMajor),
        minorHeadDisplay: formatHead(h.minorHeadCode, h.minorHead),
        subHeadDisplay: formatHead(h.subHeadCode, h.subHead),
        subSubHeadDisplay: formatHead(h.subSubHeadCode, h.subSubHead),
        detailHeadDisplay: formatHead(h.detailHeadCode, h.detailHead),
        subDetailHeadDisplay: formatHead(h.subDetailHeadCode, h.subDetailHead),
      }));

      setHeads(formatted);
    } catch (error) {
      showToast("Failed to load heads", "error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "majorHeadDisplay", label: "Major Head" },
    { key: "subMajorDisplay", label: "Sub Major" },
    { key: "minorHeadDisplay", label: "Minor Head" },
    { key: "subHeadDisplay", label: "Sub Head" },
    { key: "subSubHeadDisplay", label: "Sub Sub Head" },
    { key: "detailHeadDisplay", label: "Detail Head" },
    { key: "actions", label: "Actions" },
  ];

  const headFormFields = [
    {
      name: "grantName",
      label: "Grant Name",
      type: "text",
      placeholder: "Enter Grant Name",
    },
    {
      name: "grantCode",
      label: "Grant Code",
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

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");
    const payload = {
      ...formData,
      sector: "COUNCIL",
    };
    try {
      let res;
      if (editingHead) {
        res = await updateHead(editingHead.id, payload);
        setHeads((prev) =>
          prev.map((head) =>
            head.id === editingHead.id ? res.data.heads : head,
          ),
        );
        showToast("Head updated successfully!", "success");
      } else {
        res = await createHead(payload);
        const formattedHead = {
          ...res.data.head,
        };
        setHeads((prev) => [...prev, formattedHead]);
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

  return (
    <>
      <div className="p-6">
        <h1 className="font-unbounded text-3xl mb-10">
          Council Head Management
        </h1>

        {loading ? (
          <Loader />
        ) : (
          <DataTable
            columns={columns}
            data={heads}
            pageSize={5}
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
            loading={loading}
            downloadFileName="Council Heads"
            printTitle="Council Report"
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

      {isModalOpen && (
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
        />
      )}
    </>
  );
};

export default Council;
