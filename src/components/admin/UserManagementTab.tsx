'use client';

import React, { useState, useEffect } from 'react';
import { userManager, User, UserRole } from '@/lib/userManagement';
import { permissions } from '@/lib/userManagement';
import LuxuryCard from '@/components/ui/LuxuryCard';
import { Users, UserPlus, Edit, ToggleLeft, ToggleRight, Trash2, Shield, Eye, Crown, EyeOff, Plus, Edit2, Settings as SettingsIcon } from 'lucide-react';

interface InfluencerAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface UserManagementTabProps {
  currentUserRole: UserRole;
}

export default function UserManagementTab({ currentUserRole }: UserManagementTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, inactive: 0, admins: 0, guards: 0, influencers: 0 });
  const [activeTab, setActiveTab] = useState<'users' | 'influencers'>('users');

  // Get influencer accounts from userManager instead of separate state
  const getInfluencerAccounts = (): InfluencerAccount[] => {
    return users.filter(user => user.role === 'influencer').map(user => ({
      id: user.id,
      name: user.full_name,
      email: user.email,
      password: '****',
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: 'Active' // Could track this separately in the future
    }));
  };

  const influencerAccounts = getInfluencerAccounts();

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    password: '797@pass'
  });

  useEffect(() => {
    if (permissions.canManageUsers(currentUserRole)) {
      loadUsers();
    }
  }, [currentUserRole]);

  // Check permissions
  if (!permissions.canManageUsers(currentUserRole)) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl text-white mb-4">Access Denied</h2>
        <p className="text-white/60">You don&apos;t have permission to manage users.</p>
      </div>
    );
  }

  const loadUsers = async () => {
    try {
      const usersData = await userManager.getUsers();
      setUsers(usersData);

      // Calculate stats from users data
      const stats = {
        total: usersData.length,
        active: usersData.filter(u => u.is_active).length,
        inactive: usersData.filter(u => !u.is_active).length,
        admins: usersData.filter(u => u.role === 'admin').length,
        guards: usersData.filter(u => u.role === 'guard').length,
        influencers: usersData.filter(u => u.role === 'influencer').length
      };
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password?: string }) => {
    try {
      console.log('🔄 Creating user:', { email: userData.email, role: userData.role });

      // Use createUserWithAuth for roles that need login access (guards, admins)
      if ((userData.role === 'guard' || userData.role === 'admin') && userData.password) {
        const result = await userManager.createUserWithAuth({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone
        });

        if (!result) {
          console.error('❌ createUserWithAuth returned null');
          alert('Failed to create user. Please check console for details.');
          return;
        }

        console.log('✅ User created successfully:', result.email);
        loadUsers();
        setShowCreateModal(false);
        alert(`User created successfully!\n\nEmail: ${userData.email}\nPassword: ${userData.password}\n\nThe user can now login at /login with these credentials.`);
      } else {
        // For regular users (customers, etc.) that don't need login access
        console.log('🔄 Creating regular user without auth');
        const result = await userManager.createUser(userData);
        if (!result) {
          console.error('❌ createUser returned null');
          alert('Failed to create user. Please try again.');
          return;
        }

        console.log('✅ Regular user created successfully');
        loadUsers();
        setShowCreateModal(false);
        alert('User created successfully!');
      }
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      alert(`Failed to create user: ${error.message || 'Unknown error'}. Please check console for details.`);
    }
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    userManager.updateUser(id, updates);
    loadUsers();
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    const user = users.find(u => u.id === id);

    if (user?.role === 'admin') {
      alert('Cannot delete admin account. You can only edit admin password.');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      userManager.deleteUser(id);
      loadUsers();
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (user) {
        await userManager.updateUser(id, { is_active: !user.is_active });
        loadUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'guard': return 'text-blue-400';
      case 'influencer': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Crown size={20} />;
      case 'guard':
        return <Shield size={20} />;
      case 'influencer':
        return <Eye size={20} />;
      default:
        return <Users size={20} />;
    }
  };

  // Influencer Account Management Functions
  const toggleAccountStatus = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      handleUpdateUser(id, { is_active: !user.is_active });
    }
  };

  const deleteAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this influencer account?')) {
      userManager.deleteUser(id);
      loadUsers();
    }
  };

  const addAccount = async () => {
    if (!newAccount.name.trim() || !newAccount.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (users.some(user => user.email === newAccount.email)) {
      alert('Email already exists');
      return;
    }

    try {
      // Create influencer with authentication access
      const result = await userManager.createUserWithAuth({
        email: newAccount.email.trim(),
        password: newAccount.password || '797@pass', // Default password if not set
        full_name: newAccount.name.trim(),
        role: 'influencer',
        phone: ''
      });

      if (!result) {
        alert('Failed to create influencer account. Please check console for details.');
        return;
      }

      console.log('✅ Influencer account created successfully:', result.email);
      loadUsers();
      setNewAccount({ name: '', email: '', password: '797@pass' });
      setShowAddAccount(false);
      alert(`Influencer account created successfully!\n\nEmail: ${newAccount.email}\nPassword: ${newAccount.password}\n\nThey can now access the influencer dashboard.`);
    } catch (error) {
      console.error('Error creating influencer account:', error);
      alert('Failed to create influencer account. Please try again.');
    }
  };

  const togglePasswordVisibility = (accountId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const resetPassword = (id: string) => {
    if (confirm('Reset password to default (797@pass)?')) {
      alert('Password reset functionality would be implemented with authentication system');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div className="space-y-2">
          <h1 className="heading-font text-3xl font-light text-luxury-gradient leading-tight">
            User Management
          </h1>
          <p className="body-font text-sm text-white/60 max-w-2xl">
            Manage user accounts, influencer access, and system permissions
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/10 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg text-sm transition-all ${
              activeTab === 'users'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            System Users
          </button>
          <button
            onClick={() => setActiveTab('influencers')}
            className={`px-6 py-3 rounded-lg text-sm transition-all ${
              activeTab === 'influencers'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Influencer Accounts
          </button>
        </div>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => activeTab === 'users' ? setShowCreateModal(true) : setShowAddAccount(true)}
          className="btn-luxury flex items-center gap-3 px-6 py-3 font-medium"
        >
          <UserPlus size={18} />
          <span>{activeTab === 'users' ? 'Create System User' : 'Add Influencer Account'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeTab === 'users' ? (
          <>
            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/20">
                  <Users size={24} className="text-blue-300" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-light text-white mb-1">{userStats.active}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Active Users</span>
                </div>
              </div>
            </LuxuryCard>

            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/20">
                  <Crown size={24} className="text-red-300" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-light text-white mb-1">{userStats.admins}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Admins</span>
                </div>
              </div>
            </LuxuryCard>

            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/20">
                  <Shield size={24} className="text-green-300" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-light text-white mb-1">{userStats.guards}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Guards</span>
                </div>
              </div>
            </LuxuryCard>

            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-400/20">
                  <Eye size={24} className="text-purple-300" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-light text-white mb-1">{userStats.influencers}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Influencers</span>
                </div>
              </div>
            </LuxuryCard>
          </>
        ) : (
          <>
            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-light text-white">{influencerAccounts.length}</div>
                  <div className="text-sm text-white/60">Total Accounts</div>
                </div>
              </div>
            </LuxuryCard>

            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10">
                  <Shield size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-light text-white">{influencerAccounts.filter(acc => acc.isActive).length}</div>
                  <div className="text-sm text-white/60">Active Accounts</div>
                </div>
              </div>
            </LuxuryCard>

            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-white/10">
                  <SettingsIcon size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-light text-white">{influencerAccounts.filter(acc => !acc.isActive).length}</div>
                  <div className="text-sm text-white/60">Inactive Accounts</div>
                </div>
              </div>
            </LuxuryCard>

            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
                  <UserPlus size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-light text-white">{influencerAccounts.filter(acc => acc.lastLogin !== 'Never').length}</div>
                  <div className="text-sm text-white/60">Have Logged In</div>
                </div>
              </div>
            </LuxuryCard>
          </>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'users' ? (
        <LuxuryCard variant="elevated" className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="heading-font text-2xl font-light text-white mb-2">System Users</h3>
              <p className="body-font text-white/60">Manage user accounts and permissions</p>
            </div>
          </div>

          <div className="space-y-4">
            {users.map((user) => (
              <LuxuryCard key={user.id} variant="minimal" className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${
                      user.role === 'admin' ? 'from-red-500/20 to-orange-500/20 border-red-400/20' :
                      user.role === 'guard' ? 'from-green-500/20 to-emerald-500/20 border-green-400/20' :
                      'from-purple-500/20 to-violet-500/20 border-purple-400/20'
                    } border`}>
                      <div className={getRoleColor(user.role)}>
                        {getRoleIcon(user.role)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{user.full_name}</h4>
                      <p className="text-white/70 text-sm">{user.email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                        <span className={`text-xs ${user.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                          {user.is_active ? '● Active' : '○ Inactive'}
                        </span>
                        {user.role === 'guard' && (
                          <span className="text-xs text-white/50">
                            Scans: 0
                          </span>
                        )}
                        {user.role === 'influencer' && (
                          <span className="text-xs text-white/50">
                            Revenue: ₹0
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-500/20 transition-colors"
                      title="Edit User"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`p-2 rounded-lg border transition-colors ${
                        user.is_active
                          ? 'bg-red-500/10 text-red-400 border-red-400/20 hover:bg-red-500/20'
                          : 'bg-green-500/10 text-green-400 border-green-400/20 hover:bg-green-500/20'
                      }`}
                      title={user.is_active ? 'Deactivate User' : 'Activate User'}
                    >
                      {user.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>

                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-400/20 hover:bg-red-500/20 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </LuxuryCard>
            ))}
          </div>
        </LuxuryCard>
      ) : (
        <LuxuryCard variant="elevated" className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="heading-font text-2xl font-light text-white mb-2">
                Influencer Dashboard Accounts
              </h3>
              <p className="body-font text-white/60">
                Manage access to the influencer dashboard
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/80 font-medium py-4">Account</th>
                  <th className="text-left text-white/80 font-medium py-4">Email</th>
                  <th className="text-left text-white/80 font-medium py-4">Password</th>
                  <th className="text-left text-white/80 font-medium py-4">Status</th>
                  <th className="text-left text-white/80 font-medium py-4">Last Login</th>
                  <th className="text-center text-white/80 font-medium py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {influencerAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-white/5 hover:bg-white/3 transition-colors duration-300">
                    <td className="py-6">
                      <div>
                        <p className="text-white font-medium text-lg">{account.name}</p>
                        <p className="text-white/60 text-sm">ID: {account.id}</p>
                      </div>
                    </td>
                    <td className="py-6">
                      <code className="px-3 py-2 bg-white/8 border border-white/10 rounded-lg text-blue-300 text-sm font-mono">
                        {account.email}
                      </code>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-3">
                        <code className="px-3 py-2 bg-white/8 border border-white/10 rounded-lg text-green-300 text-sm font-mono">
                          {showPasswords[account.id] ? account.password : '••••••••'}
                        </code>
                        <button
                          onClick={() => togglePasswordVisibility(account.id)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all duration-300"
                        >
                          {showPasswords[account.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${
                        account.isActive
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-6">
                      <span className="text-white/80">{account.lastLogin}</span>
                    </td>
                    <td className="text-center py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleAccountStatus(account.id)}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            account.isActive
                              ? 'hover:bg-red-500/20 text-red-400'
                              : 'hover:bg-green-500/20 text-green-400'
                          }`}
                          title={account.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => resetPassword(account.id)}
                          className="p-2 hover:bg-yellow-500/20 rounded-lg text-yellow-400 transition-all duration-300"
                          title="Reset Password"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteAccount(account.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all duration-300"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LuxuryCard>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <UserFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <UserFormModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={(userData) => handleUpdateUser(editingUser.id, userData)}
        />
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <LuxuryCard variant="elevated" className="w-full max-w-md p-8 shadow-luxury-xl">
            <div className="text-center mb-8">
              <h3 className="heading-font text-3xl font-light text-luxury-gradient mb-3">
                Add Influencer Account
              </h3>
              <p className="body-font text-white/60">Create new dashboard access</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-white/90 text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  className="w-full px-4 py-4 glass-card border-glass rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all duration-500 focus:shadow-luxury"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-white/90 text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                  className="w-full px-4 py-4 glass-card border-glass rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all duration-500 focus:shadow-luxury"
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-white/90 text-sm font-medium">Password</label>
                <input
                  type="text"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                  className="w-full px-4 py-4 glass-card border-glass rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all duration-500 focus:shadow-luxury font-mono"
                  placeholder="Default: 797@pass"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <button
                onClick={() => setShowAddAccount(false)}
                className="flex-1 px-6 py-4 glass-card border-glass hover:bg-white/20 text-white rounded-2xl transition-all duration-500 font-medium hover:border-white/30"
              >
                Cancel
              </button>
              <button
                onClick={addAccount}
                className="flex-1 btn-luxury px-6 py-4 font-medium"
              >
                Add Account
              </button>
            </div>
          </LuxuryCard>
        </div>
      )}

    </div>
  );
}

// User Form Modal Component
interface UserFormModalProps {
  user?: User;
  onClose: () => void;
  onSubmit: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password?: string }) => void;
}

function UserFormModal({ user, onClose, onSubmit }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'guard' as UserRole,
    isActive: user?.is_active !== undefined ? user.is_active : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!user && !formData.password)) {
      alert('Please fill in all required fields');
      return;
    }

    const userData = {
      full_name: formData.name,
      email: formData.email,
      role: formData.role,
      is_active: formData.isActive,
      phone: '',
      ...(formData.password && { password: formData.password })
    };

    onSubmit(userData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header>
          <h3>{user ? 'Edit User' : 'Create New User'}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>{user ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required={!user}
            />
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
            >
              <option value="guard">Guard - QR Scanner Access</option>
              <option value="influencer">Influencer - Sales Dashboard</option>
              <option value="admin">Admin - Full Control</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              Active User
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #1c1e21;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .modal-content h3 {
          color: white;
          margin: 0;
          font-size: 1.25rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        form {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          color: white;
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: white;
          font-size: 0.9rem;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: rgba(0, 255, 100, 0.3);
          background: rgba(255, 255, 255, 0.08);
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .cancel-btn,
        .submit-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .submit-btn {
          background: rgba(0, 255, 100, 0.1);
          color: #00ff64;
          border: 1px solid rgba(0, 255, 100, 0.2);
        }

        .submit-btn:hover {
          background: rgba(0, 255, 100, 0.2);
        }
      `}</style>
    </div>
  );
}