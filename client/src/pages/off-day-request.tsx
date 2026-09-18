import { useState } from "react";
import { Button } from "@/components/ui/button";

type OffDayForm = {
  employeeName: string;
  department: string;
  jobTitle: string;
  managerName: string;
  reason: string;
  offDayOnRoster: string;
  rescheduledOffDay: string;
};

const initialForm: OffDayForm = {
  employeeName: "",
  department: "",
  jobTitle: "",
  managerName: "",
  reason: "",
  offDayOnRoster: "",
  rescheduledOffDay: "",
};

export default function OffDayRequestPage() {
  const [form, setForm] = useState<OffDayForm>(initialForm);

  const updateField = (field: keyof OffDayForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const clearForm = () => {
    setForm(initialForm);
  };

  return (
    <div className="space-y-6">
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          @media print {
            html,
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            body * {
              visibility: hidden;
            }

            .offday-print-area,
            .offday-print-area * {
              visibility: visible;
            }

            .offday-print-area {
              position: fixed;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
            }

            .offday-no-print {
              display: none !important;
            }

            .offday-print-area input {
              border: none !important;
              background: transparent !important;
              box-shadow: none !important;
              padding: 0 !important;
              color: black !important;
            }

            .offday-print-area table {
              border-collapse: collapse !important;
            }

            .offday-print-area td,
            .offday-print-area th {
              border: 1px solid #111 !important;
            }
          }
        `}
      </style>

       <div className="offday-no-print print:hidden flex items-start justify-end gap-4">

        <div className="flex gap-2">
          <Button variant="outline" onClick={clearForm}>
            Clear
          </Button>
          <Button onClick={() => window.print()}>
            Print Form
          </Button>
        </div>
      </div>

      <div className="offday-print-area mx-auto max-w-4xl bg-white p-8 text-black shadow-sm border">
      <div className="mb-6 border-b-2 border-black pb-4 text-center">
      <h1 className="text-2xl font-bold">HR Management System</h1>
      <p className="text-sm">Employee Administration</p>
      </div>

        <h2 className="mb-4 text-2xl font-bold">Off Day Request Form</h2>

        <table className="mb-5 w-full text-sm">
          <tbody>
            <tr>
              <td className="bg-gray-100 px-2 py-1 font-bold">
                How to Submit a leave request
              </td>
            </tr>
            <tr>
              <td className="px-2 py-2 leading-6">
                <div>1. Fill out the request form with accurate details.</div>
                <div>2. Submit the form to your direct manager for approval.</div>
                <div>3. Once approved, HR will verify and process the request.</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mb-5 w-full text-sm">
          <tbody>
            <tr>
              <td colSpan={4} className="bg-gray-100 px-2 py-1 font-bold">
                Employee Details
              </td>
            </tr>
            <tr>
              <td className="w-1/4 px-2 py-2 font-bold">Employee name</td>
              <td className="w-1/4 px-2 py-2">
                <input
                  value={form.employeeName}
                  onChange={(event) => updateField("employeeName", event.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent outline-none"
                />
              </td>
              <td className="w-1/4 px-2 py-2 font-bold">Department</td>
              <td className="w-1/4 px-2 py-2">
                <input
                  value={form.department}
                  onChange={(event) => updateField("department", event.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="px-2 py-2 font-bold">Job Title</td>
              <td className="px-2 py-2">
                <input
                  value={form.jobTitle}
                  onChange={(event) => updateField("jobTitle", event.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent outline-none"
                />
              </td>
              <td className="px-2 py-2 font-bold">Manager/Supervisor name</td>
              <td className="px-2 py-2">
                <input
                  value={form.managerName}
                  onChange={(event) => updateField("managerName", event.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mb-8 w-full text-sm">
          <tbody>
            <tr>
              <td colSpan={2} className="bg-gray-100 px-2 py-1 font-bold">
                Off Day request details
              </td>
            </tr>
            <tr>
              <td className="w-1/4 px-2 py-2 font-bold">Reason:</td>
              <td className="px-2 py-2">
                <input
                  value={form.reason}
                  onChange={(event) => updateField("reason", event.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="px-2 py-2 font-bold">Off Day on Roaster</td>
              <td className="px-2 py-2">
                <input
                  value={form.offDayOnRoster}
                  onChange={(event) => updateField("offDayOnRoster", event.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="px-2 py-2 font-bold">Rescheduled Off Day</td>
              <td className="px-2 py-2">
                <input
                  value={form.rescheduledOffDay}
                  onChange={(event) => updateField("rescheduledOffDay", event.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>

          <div className="mt-10">
  {/* Attachment */}
  <div>
    <h3 className="border-b-2 border-blue-800 pb-1 text-base font-bold uppercase text-blue-900">
      Attachment
    </h3>

    <div className="mt-2 grid grid-cols-[115px_16px_1fr] text-sm">
      <span className="font-semibold">Attachment</span>
      <span>:</span>
      <span>NO</span>
    </div>
  </div>

  {/* Approval */}
  <div className="mt-3">
    <h3 className="border-b-2 border-blue-800 pb-1 text-base font-bold uppercase text-blue-900">
      Approval
    </h3>

    <div className="mt-2 grid grid-cols-[115px_16px_1fr] gap-y-2 text-sm">
      <span className="font-semibold">Status</span>
      <span>:</span>
      <span>PENDING</span>

      <span className="font-semibold">HR Comment</span>
      <span>:</span>
      <span>-</span>

      <span className="font-semibold">Director Comment</span>
      <span>:</span>
      <span>-</span>
    </div>
  </div>

  {/* System Approval Record */}
  <div className="mt-5">
    <h3 className="border-b-2 border-black pb-1 text-sm font-bold uppercase text-black">
      System Approval Record
    </h3>

    <p className="mt-2 text-xs text-black">
      This document is system-generated and does not require a physical signature.
    </p>
  </div>
</div>

     </div>
    </div>
  );
}
