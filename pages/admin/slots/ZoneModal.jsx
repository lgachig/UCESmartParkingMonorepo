/**
 * Modal to create a new parking zone. Requires name, code and center lat/lng for user map redirect.
 */
export default function ZoneModal({ formData, onFormChange, onSave, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 border-t-[8px] border-[#CC0000]">
        <h2 className="text-2xl font-black text-[#003366] uppercase mb-4 text-center">Nueva Zona</h2>
        <p className="text-xs text-gray-500 mb-3">Ubicación usada para que el usuario pueda ir a esta zona desde el mapa (Zonas).</p>
        <input
          className="w-full p-4 bg-gray-50 rounded-xl mb-3 font-bold"
          placeholder="Nombre (ej. Nivel 1)"
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
        />
        <input
          className="w-full p-4 bg-gray-50 rounded-xl mb-3 font-bold"
          placeholder="Código (ej. N1)"
          value={formData.code}
          onChange={(e) => onFormChange({ ...formData, code: e.target.value })}
        />
        <input
          type="number"
          step="any"
          className="w-full p-4 bg-gray-50 rounded-xl mb-3 font-bold"
          placeholder="Latitud centro (ej. -0.1985)"
          value={formData.center_latitude}
          onChange={(e) => onFormChange({ ...formData, center_latitude: e.target.value })}
        />
        <input
          type="number"
          step="any"
          className="w-full p-4 bg-gray-50 rounded-xl mb-6 font-bold"
          placeholder="Longitud centro (ej. -78.5035)"
          value={formData.center_longitude}
          onChange={(e) => onFormChange({ ...formData, center_longitude: e.target.value })}
        />
        <form onSubmit={onSave}>
          <button type="submit" className="w-full py-4 bg-[#CC0000] text-white rounded-xl font-black uppercase shadow-lg">
            Crear
          </button>
        </form>
        <button type="button" onClick={onClose} className="w-full mt-2 py-2 text-gray-400 font-bold uppercase text-xs">
          Cancelar
        </button>
      </div>
    </div>
  );
}
