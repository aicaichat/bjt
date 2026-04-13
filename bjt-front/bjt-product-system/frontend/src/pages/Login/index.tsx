import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';
import { useTranslation } from 'react-i18next';

/** 前台登录专用品牌图（Locked Air / LOCKED PAPER），见 public/images/login-logo-locked-air.png */
const logo = '/images/login-logo-locked-air.png';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useTranslation('login');

  const clearFieldError = (field: 'username' | 'password') => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: { username?: string; password?: string } = {};
    if (!username.trim()) {
      next.username = t('validation.usernameRequired');
    }
    if (!password) {
      next.password = t('validation.passwordRequired');
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);

      const stateFrom = (location.state as { from?: string | { pathname?: string } })?.from;
      const redirectPath =
        (typeof stateFrom === 'string' ? stateFrom : stateFrom?.pathname) ||
        new URLSearchParams(location.search).get('redirect') ||
        '/machines';

      navigate(redirectPath, { replace: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t('messages.error.invalidCredentials');
      setErrorMsg(message || t('messages.error.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page login-page--figma">
      <div className="login-page__backdrop">
        <div className="login-container">
          <div className="login-brand">
            <img src={logo} alt="Locked Air — Inflatable Protective Packaging Solutions" className="logo" />
            <h1 className="login-title">{t('pageTitle')}</h1>
            <span className="login-subtitle--sr-only">{t('signInToAccessYourAccount')}</span>
          </div>

          {errorMsg ? <div className="login-error" role="alert">{errorMsg}</div> : null}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-form__fields">
              <div className="login-field">
                <label className="login-field__label" htmlFor="login-username">
                  {t('username')}
                </label>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  className="login-input"
                  autoComplete="username"
                  placeholder={t('username')}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearFieldError('username');
                  }}
                  disabled={loading}
                />
                {fieldErrors.username ? (
                  <p className="login-field__hint login-field__hint--error">{fieldErrors.username}</p>
                ) : null}
              </div>

              <div className="login-field">
                <label className="login-field__label" htmlFor="login-password">
                  {t('password')}
                </label>
                <div className="login-input-shell">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input login-input--embedded"
                    autoComplete="current-password"
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    aria-label={showPassword ? t('passwordHide') : t('passwordShow')}
                  >
                    {showPassword ? <EyeVisibleIcon /> : <EyeHiddenIcon />}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p className="login-field__hint login-field__hint--error">{fieldErrors.password}</p>
                ) : null}
              </div>
            </div>

            <div className="login-form__submit">
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? t('messages.loading') : t('login')}
              </button>
            </div>
          </form>

          <div className="login-register-footer">
            <span>{t('register.title')}</span>
            <Link to="/register">{t('register.link')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

function EyeHiddenIcon() {
  return (
    <svg className="login-password-toggle__icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.37 1.83l2.98 2.98c1.62-1.38 2.9-3.16 3.65-5.19C21.27 7.11 17 4 12 4c-1.27 0-2.49.22-3.64.63l1.51 1.51C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3-.17 0-.34.01-.51.03z"
      />
    </svg>
  );
}

function EyeVisibleIcon() {
  return (
    <svg className="login-password-toggle__icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-5-7.5-10-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
      />
    </svg>
  );
}

export default Login;
