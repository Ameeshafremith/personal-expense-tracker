
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

function ProtectedRoute() {
    const { isAuthenticated, initialized } = useAppSelector(
        (state) => state.auth
    );

    if (!initialized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0b1020] text-white">
                Checking your session...
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
