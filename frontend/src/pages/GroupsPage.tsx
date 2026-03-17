import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGroups, createGroup, type Group } from '../lib/api';

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createGroup(newGroupName.trim());
      setNewGroupName('');
      setShowCreate(false);
      load();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      setCreateError(axErr.response?.data?.error || 'Erro ao criar grupo');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Meus Grupos</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          <span>+</span> Criar grupo
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Novo grupo</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome do grupo (ex: Amigos do Trabalho)"
              maxLength={60}
              required
              autoFocus
              className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {createError && (
              <p className="text-red-500 text-xs">{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-60 transition-colors"
              >
                {creating ? 'Criando...' : 'Criar grupo'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateError(null); setNewGroupName(''); }}
                className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Groups list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100 h-16" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-4xl mb-3">👥</p>
          <h3 className="font-semibold text-gray-700 mb-1">Nenhum grupo ainda</h3>
          <p className="text-gray-400 text-sm mb-4">
            Crie um grupo ou entre em um com o link de convite
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            Criar meu primeiro grupo
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/grupos/${group.id}`}
              className="bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow transition-all flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {group.name[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{group.name}</p>
                {group.member_count != null && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {group.member_count} {group.member_count === 1 ? 'membro' : 'membros'}
                  </p>
                )}
              </div>

              <span className="text-gray-400 text-lg">›</span>
            </Link>
          ))}
        </div>
      )}

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">💡 Dica</p>
        <p>
          Se você recebeu um link de convite, clique nele diretamente ou acesse o link no seu
          navegador para entrar em um grupo.
        </p>
      </div>
    </div>
  );
};

export default GroupsPage;
