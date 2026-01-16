"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import { Shield, Sword, LogOut, Edit2, Save, X, Clock, Trophy, Star, Lock, Mail, User } from "lucide-react";

interface Profile {
  id: string;
  avatar_url: string | null;
  player_name: string | null;
  games_count: number;
  level: number;
  user_id: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    player_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (data) {
          setProfile(data);
          setEditForm({
            player_name: data.player_name || "",
            email: currentUser.email || "",
            password: "",
            confirmPassword: "",
          });
          return;
        }

        const isNotFound = !data && (!error || error.code === "PGRST116" || error.message?.includes("No rows"));
        
        if (isNotFound) {
          const newProfile = {
            user_id: currentUser.id,
            player_name: currentUser.email?.split("@")[0] || "Игрок",
            avatar_url: null,
            games_count: 0,
            level: 1,
          };

          const { data: createdProfile, error: createError } = await supabase
            .from("profiles")
            .insert([newProfile])
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            setProfile({
              id: currentUser.id,
              user_id: currentUser.id,
              player_name: currentUser.email?.split("@")[0] || "Игрок",
              avatar_url: null,
              games_count: 0,
              level: 1,
            });
          } else if (createdProfile) {
            setProfile(createdProfile);
            setEditForm({
              player_name: createdProfile.player_name || "",
              email: currentUser.email || "",
              password: "",
              confirmPassword: "",
            });
          }
        } else {
          console.error("Error loading profile:", error);
          setProfile({
            id: currentUser.id,
            user_id: currentUser.id,
            player_name: currentUser.email?.split("@")[0] || "Игрок",
            avatar_url: null,
            games_count: 0,
            level: 1,
          });
          setEditForm({
            player_name: currentUser.email?.split("@")[0] || "",
            email: currentUser.email || "",
            password: "",
            confirmPassword: "",
          });
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    loadProfile();
  }, [router]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditError(null);
    setEditSuccess(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      player_name: profile?.player_name || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
    });
    setEditError(null);
    setEditSuccess(false);
  };

  const handleSaveEdit = async () => {
    setEditError(null);
    setEditSuccess(false);

    try {
      // Валидация пароля
      if (editForm.password && editForm.password !== editForm.confirmPassword) {
        setEditError("Пароли не совпадают");
        return;
      }

      if (editForm.password && editForm.password.length < 6) {
        setEditError("Пароль должен содержать минимум 6 символов");
        return;
      }

      // Обновляем email, если изменился
      if (editForm.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editForm.email,
        });
        if (emailError) {
          setEditError(`Ошибка обновления email: ${emailError.message}`);
          return;
        }
      }

      // Обновляем пароль, если указан
      if (editForm.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: editForm.password,
        });
        if (passwordError) {
          setEditError(`Ошибка обновления пароля: ${passwordError.message}`);
          return;
        }
      }

      // Обновляем никнейм в профиле
      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({ player_name: editForm.player_name })
        .eq("user_id", user.id)
        .select()
        .single();

      if (profileError) {
        setEditError(`Ошибка обновления профиля: ${profileError.message}`);
        return;
      }

      // Обновляем локальное состояние
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      
      // Обновляем данные пользователя
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }

      setEditSuccess(true);
      setIsEditing(false);
      
      // Очищаем поля пароля
      setEditForm(prev => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));

      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err: any) {
      setEditError(err.message || "Произошла ошибка при сохранении");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayProfile = profile || {
    id: user?.id || "",
    user_id: user?.id || "",
    player_name: user?.email?.split("@")[0] || "Игрок",
    avatar_url: null,
    games_count: 0,
    level: 1,
  };

  // Вычисляем прогресс XP (на основе уровня)
  const xpProgress = ((displayProfile.level % 10) / 10) * 100;
  const rankName = displayProfile.level >= 20 ? "VETERAN" : displayProfile.level >= 10 ? "EXPERIENCED" : "NOVICE";

  return (
    <main className="relative min-h-screen text-[#d1c7bc] font-serif selection:bg-amber-900/50 pt-24 pb-20 px-4">
      <AtmosphericBackground />

      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-amber-50 uppercase tracking-tight mb-4">
            Лист персонажа
          </h1>
          <div className="h-[1px] w-32 mx-auto bg-amber-700/50"></div>
        </div>

        {/* Основной контент в два столбца */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Левая панель - Профиль */}
          <div className="relative">
            <div className="absolute -inset-4 bg-amber-900/10 border-2 border-amber-700/30 -rotate-1"></div>
            <div className="absolute -inset-2 bg-amber-900/5 border border-amber-700/20 rotate-1"></div>
            
            <div className="relative bg-[#0f0d0c]/95 backdrop-blur-sm border-4 border-amber-700/40 p-8 shadow-2xl">
              {/* Гексагональный аватар с эффектом драконьей рамки */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-6">
                  {/* Эффект свечения */}
                  <div 
                    className="absolute -inset-3 bg-cyan-500/20 blur-xl animate-pulse"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  ></div>
                  {/* Рамка */}
                  <div 
                    className="relative w-40 h-40 sm:w-48 sm:h-48 border-4 border-amber-600/80 overflow-hidden bg-gradient-to-br from-amber-900/40 to-amber-950/60 shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                    style={{ 
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      boxShadow: '0 0 30px rgba(34, 211, 238, 0.3), inset 0 0 30px rgba(251, 191, 36, 0.2)'
                    }}
                  >
                    {displayProfile.avatar_url ? (
                      <Image
                        src={displayProfile.avatar_url}
                        alt={displayProfile.player_name || "Игрок"}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover"
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-300/80 text-5xl font-bold">
                        {displayProfile.player_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ранг и XP бар */}
                <div className="w-full mb-6">
                  <div className="text-center mb-2">
                    <span className="text-xs uppercase tracking-widest text-amber-500/70">Ранг</span>
                    <h3 className="text-2xl font-bold text-amber-300 uppercase tracking-wider">
                      {rankName} RANK
                    </h3>
                  </div>
                  <div className="relative w-full h-4 bg-amber-900/30 border border-amber-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-amber-600 transition-all duration-500"
                      style={{ width: `${xpProgress}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-50">
                      {Math.round(xpProgress)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Имя игрока */}
              <div className="text-center mb-8 pb-8 border-b-2 border-amber-700/30">
                <h2 className="text-3xl sm:text-4xl font-bold text-amber-50 uppercase tracking-wider mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.player_name}
                      onChange={(e) => setEditForm({ ...editForm, player_name: e.target.value })}
                      className="w-full bg-[#1a1614] border-2 border-amber-700/50 text-amber-50 px-4 py-2 text-center text-3xl font-bold uppercase"
                    />
                  ) : (
                    displayProfile.player_name || "Игрок"
                  )}
                </h2>
                <p className="text-amber-600/70 text-sm uppercase tracking-widest">
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-[#1a1614] border-2 border-amber-700/50 text-amber-50 px-4 py-2 text-center text-sm"
                    />
                  ) : (
                    user?.email
                  )}
                </p>
              </div>

              {/* Статистика */}
              <div className="space-y-4 mb-8">
                <div className="relative bg-[#1a1614] border-2 border-amber-700/40 p-4 hover:border-cyan-500/60 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-900/80 border-2 border-amber-700/50 p-3">
                      <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-amber-600/70 text-xs uppercase tracking-widest mb-1">
                        Игр сыграно
                      </div>
                      <div className="text-3xl font-bold text-amber-50">
                        {displayProfile.games_count || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative bg-[#1a1614] border-2 border-amber-700/40 p-4 hover:border-cyan-500/60 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-900/80 border-2 border-amber-700/50 p-3">
                      <Sword className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-amber-600/70 text-xs uppercase tracking-widest mb-1">
                        Уровень
                      </div>
                      <div className="text-3xl font-bold text-amber-50">
                        {displayProfile.level || 1}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative bg-[#1a1614] border-2 border-amber-700/40 p-4 hover:border-cyan-500/60 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-900/80 border-2 border-amber-700/50 p-3">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-amber-600/70 text-xs uppercase tracking-widest mb-1">
                        Часов всего
                      </div>
                      <div className="text-3xl font-bold text-amber-50">
                        {displayProfile.games_count * 4 || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    {/* Поля для редактирования пароля */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-amber-600/70 mb-1">
                          Новый пароль
                        </label>
                        <input
                          type="password"
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          placeholder="Оставьте пустым, чтобы не менять"
                          className="w-full px-4 py-2 bg-[#1a1614] border-2 border-amber-700/50 text-amber-50 placeholder:text-amber-700/50 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      {editForm.password && (
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-amber-600/70 mb-1">
                            Подтвердите пароль
                          </label>
                          <input
                            type="password"
                            value={editForm.confirmPassword}
                            onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2 bg-[#1a1614] border-2 border-amber-700/50 text-amber-50 placeholder:text-amber-700/50 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      )}
                    </div>

                    {editError && (
                      <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-2 text-sm mb-3">
                        {editError}
                      </div>
                    )}

                    {editSuccess && (
                      <div className="bg-green-900/20 border border-green-700/50 text-green-400 px-4 py-2 text-sm mb-3">
                        Профиль успешно обновлен!
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-900/30 border-2 border-cyan-600/50 text-cyan-400 font-black uppercase tracking-wider hover:bg-cyan-600 hover:text-black transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Сохранить
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-900/20 border-2 border-amber-700/50 text-amber-500 font-black uppercase tracking-wider hover:bg-amber-600 hover:text-black transition-all"
                      >
                        <X className="w-4 h-4" />
                        Отмена
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-900/20 border-2 border-amber-700/50 text-amber-500 font-black uppercase tracking-wider hover:bg-amber-600 hover:text-black transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    Редактировать профиль
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-900/20 border-2 border-red-700/50 text-red-400 font-black uppercase tracking-wider hover:bg-red-700 hover:text-black transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из системы
                </button>
              </div>
            </div>
          </div>

          {/* Правая панель - Достижения и история */}
          <div className="space-y-8">
            {/* Достижения */}
            <div className="relative">
              <div className="absolute -inset-4 bg-amber-900/10 border-2 border-amber-700/30 -rotate-1"></div>
              <div className="absolute -inset-2 bg-amber-900/5 border border-amber-700/20 rotate-1"></div>
              
              <div className="relative bg-[#0f0d0c]/95 backdrop-blur-sm border-4 border-amber-700/40 p-6 shadow-2xl">
                <h3 className="text-2xl font-bold text-amber-50 uppercase tracking-wider mb-6 text-center">
                  Достижения
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { name: "Первая кровь", unlocked: displayProfile.games_count > 0 },
                    { name: "Ветераны", unlocked: displayProfile.games_count >= 10 },
                    { name: "Легенда", unlocked: displayProfile.games_count >= 50 },
                    { name: "Мастер", unlocked: displayProfile.level >= 10 },
                  ].map((achievement, i) => (
                    <div
                      key={i}
                      className={`aspect-square border-2 p-2 transition-all ${
                        achievement.unlocked
                          ? "border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                          : "border-amber-700/30 bg-amber-900/5 opacity-50"
                      }`}
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        {achievement.unlocked ? (
                          <Trophy className="w-6 h-6 text-cyan-400" />
                        ) : (
                          <Lock className="w-6 h-6 text-amber-700/50" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* История игр */}
            <div className="relative">
              <div className="absolute -inset-4 bg-amber-900/10 border-2 border-amber-700/30 -rotate-1"></div>
              <div className="absolute -inset-2 bg-amber-900/5 border border-amber-700/20 rotate-1"></div>
              
              <div className="relative bg-[#0f0d0c]/95 backdrop-blur-sm border-4 border-amber-700/40 p-6 shadow-2xl">
                <h3 className="text-2xl font-bold text-amber-50 uppercase tracking-wider mb-6 text-center">
                  История приключений
                </h3>
                <div className="space-y-3">
                  {displayProfile.games_count > 0 ? (
                    Array.from({ length: Math.min(displayProfile.games_count, 5) }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-[#1a1614] border border-amber-700/30 hover:border-cyan-500/50 transition-all"
                      >
                        <div className="bg-green-900/30 border border-green-700/50 p-2">
                          <Shield className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-amber-50 text-sm font-bold">Приключение #{i + 1}</div>
                          <div className="text-amber-600/70 text-xs">Завершено</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-amber-600/50 italic">
                      История приключений пуста
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
