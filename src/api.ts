export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const savedUser = localStorage.getItem('user');
  const user = (savedUser && savedUser !== 'undefined') ? JSON.parse(savedUser) : null;
  const headers = {
    ...options.headers as any,
    'Content-Type': 'application/json',
  };
  
  if (user?.id) {
    headers['x-user-id'] = user.id.toString();
  }

  console.log(`Fetching: ${url}`);
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};
