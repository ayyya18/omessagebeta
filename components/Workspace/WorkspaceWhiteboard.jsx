import React, { useRef, useState, useEffect } from 'react';
import { FiSave, FiTrash2, FiPenTool, FiMaximize, FiType } from 'react-icons/fi';
import { useWorkspace } from '../../context/WorkspaceContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const WorkspaceWhiteboard = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const { currentWorkspace } = useWorkspace();
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

    // Load saved canvas
    useEffect(() => {
        if (!currentWorkspace) return;
        const loadCanvas = async () => {
            const docRef = doc(db, 'workspaces', currentWorkspace.id, 'whiteboard', 'main');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().image) {
                const img = new Image();
                img.src = docSnap.data().image;
                img.onload = () => {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                };
            }
        };
        loadCanvas();
    }, [currentWorkspace]);

    const startDrawing = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        setIsDrawing(true);
        setLastPos({ x: offsetX, y: offsetY });
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();

        setLastPos({ x: offsetX, y: offsetY });
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const saveCanvas = async () => {
        const canvas = canvasRef.current;
        const dataURL = canvas.toDataURL(); // Save as image
        try {
            await setDoc(doc(db, 'workspaces', currentWorkspace.id, 'whiteboard', 'main'), {
                image: dataURL,
                updatedAt: new Date().toISOString()
            });
            alert("Whiteboard saved!");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="whiteboard-container" style={{ display: 'flex', flexDirection: 'column', height: '70vh', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            {/* Toolbar */}
            <div className="wb-toolbar" style={{ padding: 10, background: '#f3f4f6', display: 'flex', gap: 16, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <FiPenTool />
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ border: 'none', width: 24, height: 24, cursor: 'pointer' }} />
                    <input type="range" min="1" max="10" value={lineWidth} onChange={e => setLineWidth(e.target.value)} style={{ width: 60 }} />
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="glass-btn small danger" onClick={clearCanvas}><FiTrash2 /> Clear</button>
                    <button className="glass-btn small primary" onClick={saveCanvas}><FiSave /> Save Board</button>
                </div>
            </div>

            <div ref={containerRef} style={{ flex: 1, position: 'relative', cursor: 'crosshair' }}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600} // Fixed size for MVP, ideally dynamic
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{ display: 'block', width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
};

export default WorkspaceWhiteboard;
