'use client';

/**
 * Port of `assets/components/Worker/WorkerTerminatedScreen.js`.
 *
 * Note: this screen existed in the RN codebase but was never registered in the
 * navigator, so it was unreachable dead code. It is wired up here (the API call
 * and the payload mapping are unchanged) and reads the worker id from the
 * session instead of a missing route param.
 */

import { useCallback, useEffect, useState } from 'react';
import { FileWarning, MapPin, Phone } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import Storage from '@/lib/storage';
import { ApiError } from '@/lib/api/client';

export default function WorkerTerminatedPage() {
  const [terminationData, setTerminationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTerminationDetails = useCallback(async () => {
    const workerId = Storage.getItem('workerId');
    if (!workerId) {
      setErrorMsg('Worker routing parameters missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const data: any = await DashboardService.getWorkerEndContractDetails(workerId);

      setTerminationData({
        worker: {
          name: data.workerName,
          role: data.workerSkill,
          address: data.workerAddress,
          phone: data.workerPhone,
          experience: 'Active Job Record',
          avatar: data.workerPicture,
        },
        details: {
          status: data.status, // "Resigned" or "Terminated"
          date: data.date,
          reason: data.reason,
        },
        client: {
          name: data.clientName,
          address: data.clientAddress,
          avatar: data.clientPicture,
        },
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setErrorMsg('No contract exit status found for this worker.');
      } else {
        setErrorMsg('Could not load the contract exit status.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerminationDetails();
  }, [fetchTerminationDetails]);

  if (loading) return <Loader label="Loading contract record…" />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Contract Ended" subtitle="The record of your last closed contract." back backHref="/worker/dashboard" />

      {errorMsg || !terminationData ? (
        <EmptyState title={errorMsg || 'No contract exit status found.'} icon={<FileWarning size={24} />} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <p className="label-xs mb-3">Worker</p>
            <div className="flex items-center gap-4">
              <Avatar src={terminationData.worker.avatar} name={terminationData.worker.name} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-extrabold text-ink">{terminationData.worker.name}</h2>
                <p className="truncate text-sm text-subtle">{terminationData.worker.role}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-sm text-subtle">
              {terminationData.worker.address && (
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 text-rose-500" /> {terminationData.worker.address}
                </p>
              )}
              {terminationData.worker.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={15} className="text-brand" /> {terminationData.worker.phone}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <p className="label-xs mb-3">Client</p>
            <div className="flex items-center gap-4">
              <Avatar src={terminationData.client.avatar} name={terminationData.client.name} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-extrabold text-ink">{terminationData.client.name}</h2>
                <p className="truncate text-sm text-subtle">{terminationData.client.address}</p>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <p className="label-xs mb-3">Contract exit</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-subtle">Status</p>
                <p className="text-base font-bold text-ink">{terminationData.details.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-subtle">Date</p>
                <p className="text-base font-bold text-ink">{terminationData.details.date}</p>
              </div>
              <div className="sm:col-span-3">
                <p className="text-xs font-semibold text-subtle">Reason</p>
                <p className="text-sm text-ink">{terminationData.details.reason}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
