import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { updateProfile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PhotoUpload from '../components/PhotoUpload';

const ProfileSetupPage: React.FC = () => {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectAfter = searchParams.get('redirect') || '/';

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [photo, setPhoto] = useState<File | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.display_name) setDisplayName(user.display_name);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('O nome é obrigatório.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateProfile(displayName.trim(), photo);
      await refresh();
      navigate(redirectAfter, { replace: true });
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      setError(axErr.response?.data?.error || 'Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isSetup = !user?.display_name;

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isSetup ? 'Configure seu perfil' : 'Editar perfil'}
          </h1>
          {isSetup && (
            <p className="text-gray-500 text-sm mt-1">
              Antes de continuar, escolha como você quer aparecer no bolão
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Photo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
              Foto de perfil <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <PhotoUpload
              currentPhotoUrl={user?.photo_path || undefined}
              onPhotoSelected={(file) => setPhoto(file)}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nome de exibição <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como você quer ser chamado?"
              maxLength={50}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">{displayName.length}/50 caracteres</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white rounded-xl py-3 font-bold hover:bg-orange-600 disabled:opacity-60 transition-colors text-base"
          >
            {loading ? 'Salvando...' : isSetup ? 'Salvar e continuar' : 'Salvar alterações'}
          </button>

          {!isSetup && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
