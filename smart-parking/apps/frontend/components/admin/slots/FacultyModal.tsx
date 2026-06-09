'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Pencil, Trash2 } from 'lucide-react';
import { parkingService, type Faculty } from '@/services/parking.service';

interface FacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FacultyModal({ isOpen, onClose, onSuccess }: FacultyModalProps) {
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchFaculties = async () => {
    try {
      setLoadingList(true);
      const list = await parkingService.getFaculties();
      setFaculties(list);
    } catch (err) {
      console.error('Error fetching faculties:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFaculties();
      setFormData({ name: '', code: '' });
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Todos los campos son obligatorios');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.toUpperCase().trim(),
      };

      if (editingId !== null) {
        await parkingService.updateFaculty(editingId, payload);
        setEditingId(null);
      } else {
        await parkingService.createFaculty(payload);
      }
      setFormData({ name: '', code: '' });
      await fetchFaculties();
      onSuccess();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fac: Faculty) => {
    setEditingId(fac.id);
    setFormData({ name: fac.name, code: fac.code });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la facultad "${name}"? Se borrarán también sus zonas y puestos asociados.`)) return;
    try {
      setLoading(true);
      await parkingService.deleteFaculty(id);
      if (editingId === id) {
        setEditingId(null);
        setFormData({ name: '', code: '' });
      }
      await fetchFaculties();
      onSuccess();
    } catch (err: any) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', code: '' });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-8 border-t-[8px] border-emerald-600 relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:text-red-500 transition-colors">
          <X size={16} />
        </button>

        {/* Columna Izquierda: Formulario */}
        <div className="w-full md:w-1/2 flex flex-col justify-start">
          <h2 className="text-2xl font-black text-[#003366] uppercase mb-1 text-center md:text-left">
            {editingId !== null ? 'Editar Facultad' : 'Nueva Facultad'}
          </h2>
          <p className="text-xs text-gray-500 mb-6 text-center md:text-left">
            {editingId !== null ? 'Modifica los datos de la facultad.' : 'Registra una nueva facultad en el sistema.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                Nombre de la Facultad
              </label>
              <input
                className="w-full p-4 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-[#003366] outline-none"
                placeholder="ej. Facultad de Ciencias Químicas"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                Código de la Facultad
              </label>
              <input
                className="w-full p-4 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-[#003366] outline-none"
                placeholder="ej. FCQ"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-black uppercase transition-all text-center cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : editingId !== null ? 'Guardar Cambios' : 'Crear Facultad'}
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Listado */}
        <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l border-gray-100 pl-0 md:pl-8 flex flex-col max-h-[450px]">
          <h3 className="text-xl font-black text-[#003366] uppercase mb-4">Facultades Existentes</h3>
          {loadingList ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-emerald-600" size={24} />
            </div>
          ) : faculties.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No hay facultades registradas.</p>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {faculties.map((fac) => (
                <div
                  key={fac.id}
                  className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${
                    editingId === fac.id ? 'border-[#003366] bg-blue-50/20' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="font-black text-sm text-[#003366] truncate uppercase">{fac.name}</p>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-mono text-[10px] font-black mt-1">
                      {fac.code}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => handleEdit(fac)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(fac.id, fac.name)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
