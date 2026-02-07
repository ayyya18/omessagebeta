import React from 'react';
import { usePermissions } from '../../context/PermissionsContext';

const PermissionGate = ({ action, resource, workspaceId, context = {}, children, fallback = null }) => {
    const { canPerform } = usePermissions();
    const [hasPermission, setHasPermission] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const checkPermission = async () => {
            if (!workspaceId) {
                setHasPermission(false);
                setLoading(false);
                return;
            }

            const allowed = await canPerform(action, resource, workspaceId, context);
            setHasPermission(allowed);
            setLoading(false);
        };

        checkPermission();
    }, [action, resource, workspaceId, context]);

    if (loading) {
        return null; // Or a loading indicator
    }

    return hasPermission ? children : fallback;
};

export default PermissionGate;
