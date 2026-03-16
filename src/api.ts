export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const savedUser = localStorage.getItem('user');
  const user = (savedUser && savedUser !== 'undefined') ? JSON.parse(savedUser) : null;
  const headers = {
    ...options.headers as any,
    'Content-Type': 'application/json',
  };
  
  if (user?.id) {
    headers['x-user-id'] = user.id.toString();
  } else {
    console.warn(`apiFetch: No user ID found in localStorage for ${url}`);
  }

  console.log(`Fetching: ${url}`, { method: options.method, headers });
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP error! status: ${response.status}`) as any;
    error.status = response.status;
    throw error;
  }
  return response.json();
};
