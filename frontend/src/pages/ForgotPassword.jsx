import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await authAPI.forgotPassword({ email });
            setMessage(response.message || 'Email reset link sent to your inbox');
            setSubmitted(true);
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                {!submitted ? (
                    <>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h1>
                        <p className="text-gray-600 mb-6">Nhập email của bạn để nhận link cấp lại mật khẩu</p>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                            >
                                {loading ? 'Đang gửi...' : 'Gửi link reset'}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-600">
                            Nhớ mật khẩu rồi?{' '}
                            <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                                Đăng nhập
                            </Link>
                        </p>
                    </>
                ) : (
                    <>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">✓</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email đã gửi</h2>
                            <p className="text-gray-600 mb-4">
                                Vui lòng kiểm tra email <span className="font-semibold">{email}</span> để nhận link cấp lại mật khẩu.
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Link sẽ hết hạn trong 1 giờ. Nếu không nhận được, hãy kiểm tra thư mục Spam.
                            </p>

                            <Link
                                to="/login"
                                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
