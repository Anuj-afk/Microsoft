import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/Layout/AdminLayout";
import Home from "./Pages/Home";
import Products from "./Pages/Product";
import Device from "./Pages/Device";
import Admin from "./Pages/Admin";
import Logo from "./Pages/Admin/Logo";
import Login from "./Pages/Login";

// Admin Pages
import Categories from "./Pages/Admin/Categories";
import HomeEdit from "./Pages/Admin/Pages/Home";
import Banner from "./Pages/Admin/Sections/Banner";
import Offer from "./Pages/Admin/Sections/Offer";
import Media from "./Pages/Admin/Media";
import Settings from "./Pages/Admin/Settings";

// Device Components
import DeviceList from "./Pages/Admin/Devices/DeviceList";
import AddDevice from "./Pages/Admin/Devices/AddDevice";
import CategoryDevices from "./Pages/Admin/Devices/CategoryDevices";

// User Management pages
import {
    AllUsers,
    AdminUsers,
    Customers,
    ManageRoles,
    CreateUser,
    EditUser,
    Permissions,
} from "./Pages/Admin/Users";

function App() {
    return (
        <AuthProvider>
            {/* <Router> */}
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/:slug" element={<Products />} />
                        <Route path="/product/:id" element={<Device />} />
                        <Route path="/device/:id" element={<Device />} />
                        <Route path="login" element={<Login />} />
                    </Route>
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute adminOnly={true}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Admin />} />
                        <Route path="pages">
                            <Route path="home" element={<HomeEdit />} />
                            <Route path="home/banner" element={<Banner />} />
                            <Route path="home/offer" element={<Offer />} />
                        </Route>
                        <Route path="categories" element={<Categories />} />
                        <Route path="devices">
                            <Route path="all" element={<DeviceList />} />
                            <Route path="add" element={<AddDevice />} />
                            <Route path="edit/:id" element={<AddDevice />} />
                            <Route path=":slug" element={<CategoryDevices />} />
                        </Route>
                        <Route path="media">
                            <Route path="library" element={<Media.Library />} />
                            <Route path="upload" element={<Media.Upload />} />
                        </Route>
                        {/* User Management Routes */}
                        <Route path="users/all" element={<AllUsers />} />
                        <Route path="users/admins" element={<AdminUsers />} />
                        <Route path="users/customers" element={<Customers />} />
                        <Route path="users/roles" element={<ManageRoles />} />
                        <Route path="users/create" element={<CreateUser />} />
                        <Route path="users/edit/:id" element={<EditUser />} />
                        <Route path="users/permissions/:id" element={<Permissions />} />    

                        <Route path="settings" element={<Settings />} />
                        <Route path="logo" element={<Logo />} />
                        
                    </Route>
                    {/* Catch all route */}
                    <Route
                        path="*"
                        element={
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-center">
                                    <h1 className="text-4xl font-bold text-gray-900">
                                        404
                                    </h1>
                                    <p className="text-gray-600">
                                        Page not found
                                    </p>
                                </div>
                            </div>
                        }
                    />
                </Routes>
            {/* </Router> */}
        </AuthProvider>
    );
}

export default App;
