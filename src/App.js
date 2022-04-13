import './App.css';
import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import Orbit from './components/HelperComponents/Orbit';
import Box from './components/Objects/Box';
import Lights from './components/Objects/Lights';
import ColorPicker from './components/UIComponents/ColorPicker';
import { Physics } from '@react-three/cannon';
import Dragable from './components/HelperComponents/Dragable';
import Model from './components/HelperComponents/Model';
import Wall from './components/Objects/Wall';
import FloatingButtons from './components/UIComponents/FloatingButtons';
import WallModel from './models/wall.js';
import BoundingBox from './components/HelperComponents/BoundingBox';
import ObjectDetails from './components/UIComponents/ObjectDetails';
function App() {
    const [walls, setWalls] = useState([
        new WallModel([16, 0.2, 10], [0, -0.1, 0], null, '/wood.jpg'),
        new WallModel([0.2, 6, 10], [-8.1, 3, 0], 'pink'),
        new WallModel([16, 6, 0.2], [0, 3, -5.1], 'pink'),
    ]);
    const [objects, setObjects] = useState([]);
    const [focusedObject, setFocusedObject] = useState(null);
    const [mode, setMode] = useState('');
    const [count, setCount] = useState(0);
    let currentObject = null;

    // useEffect(() => {
    //     setCount(count + 1);
    //     console.log(focusedObject);
    //     console.log(count);
    // }, [count]);

    const saveFile = async (blob) => {
        const a = document.createElement('a');
        a.download = 'my-room.json';
        a.href = URL.createObjectURL(blob);
        a.addEventListener('click', (e) => {
            setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
        });
        a.click();
    };

    const exportData = () => {
        const data = { walls, objects };
        const jsonData = JSON.stringify(data);
        console.log(jsonData);
        const blob = new Blob([jsonData], { type: 'application/json' });
        saveFile(blob);
    };

    const importData = (data) => {
        setWalls(data.walls);
        setObjects(data.objects);
    };

    const createWallHandle = (wall) => {
        console.log('create wall');
        setWalls([...walls, wall]);
    };

    const setPosition = (object, position) => {
        object.position[0] = position[0];
        object.position[1] = position[1];
        object.position[2] = position[2];
        object.calcPosition[0] = position[0];
        object.calcPosition[1] = position[1];
        object.calcPosition[2] = position[2];
        if (object.lockY) {
            object.calcPosition[1] = (object.dims[1] * object.customScale) / 2;
        }
    };

    const scaleObject = (object, customScale) => {
        console.log(object.dims);
        object.customScale = customScale;
        const dims = [...object.dims];
        object.calcDims[0] = customScale * dims[0];
        object.calcDims[1] = customScale * dims[1];
        object.calcDims[2] = customScale * dims[2];
        console.log(object.dims);
        console.log(object.calcDims);
        if (object.lockY) {
            object.calcPosition[1] = (dims[1] * object.customScale) / 2;
        }
        object.calcScale[0] = object.scale[0] * customScale;
        object.calcScale[1] = object.scale[1] * customScale;
        object.calcScale[2] = object.scale[2] * customScale;
        let angle = object.customRotationY;
        let x = 1;
        if (object.offset[0] < 0 && object.offset[2] < 0) x = -1;
        if (object.offset[0] < 0 && object.offset[2] > 0) x = -1;
        const l = Math.sqrt(object.offset[0] * object.offset[0] + object.offset[2] * object.offset[2]);
        const a = arcctg(object.offset[2] / object.offset[0]);
        angle *= Math.PI / 180;
        angle += !!a ? a : 0;
        object.calcOffset[0] = x * l * object.customScale * Math.sin(angle);
        object.calcOffset[1] = object.offset[1] * customScale;
        object.calcOffset[2] = x * l * object.customScale * Math.cos(angle);
    };

    const rotateObject = (object, customRotationY) => {
        object.calcRotation[1] = object.rotation[1] + (customRotationY * Math.PI) / 180;
        object.customRotationY = customRotationY;
    };

    let addModel = (model) => {
        currentObject = model;
    };

    let placeObject = (position, args) => {
        if (currentObject != null) {
            currentObject.position = position;
            if (args[1] < args[0] && args[1] < args[2]) currentObject.position[1] += currentObject.dims[1] / 2;
            if (args[0] < args[1] && args[0] < args[2]) {
                if (currentObject.dims[2] < currentObject.dims[0] && currentObject.dims[2] < currentObject.dims[1]) {
                    currentObject.rotation[1] += Math.PI / 2;
                    currentObject.dims[0] += currentObject.dims[2];
                    currentObject.dims[2] = currentObject.dims[0] - currentObject.dims[2];
                    currentObject.dims[0] = currentObject.dims[0] - currentObject.dims[2];
                    currentObject.offset[0] += currentObject.offset[2];
                    currentObject.offset[2] = currentObject.offset[0] - currentObject.offset[2];
                    currentObject.offset[0] = -currentObject.offset[0] + currentObject.offset[2];
                    currentObject.lockX = true;
                    currentObject.lockZ = false;
                }
                currentObject.position[0] += currentObject.dims[0] / 2;
            }
            if (args[2] < args[0] && args[2] < args[1]) {
                if (currentObject.dims[0] < currentObject.dims[1] && currentObject.dims[0] < currentObject.dims[2]) {
                    currentObject.rotation[1] -= Math.PI / 2;
                    currentObject.dims[0] += currentObject.dims[2];
                    currentObject.dims[2] = currentObject.dims[0] - currentObject.dims[2];
                    currentObject.dims[0] = currentObject.dims[0] - currentObject.dims[2];
                    currentObject.offset[0] += currentObject.offset[2];
                    currentObject.offset[2] = currentObject.offset[0] - currentObject.offset[2];
                    currentObject.offset[0] = -currentObject.offset[0] + currentObject.offset[2];
                    currentObject.lockX = false;
                    currentObject.lockZ = true;
                }
                currentObject.position[2] += currentObject.dims[2] / 2;
            }
            currentObject.calcDims = [...currentObject.dims];
            currentObject.calcPosition = [...currentObject.position];
            setObjects([...objects, currentObject]);
            currentObject = null;
        }
    };

    const getScale = (scale, customScale) => {
        return [scale[0] * customScale, scale[1] * customScale, scale[2] * customScale];
    };

    const getRotation = (rotation, customRotationY) => {
        return [rotation[0], rotation[1] + (customRotationY * Math.PI) / 180, rotation[2]];
    };

    function arcctg(x) {
        return Math.PI / 2 - Math.atan(x);
    }

    const getOffset = (offset, customScale, angle = 0) => {
        let x = 1;
        if (offset[0] < 0 && offset[2] < 0) x = -1;
        if (offset[0] < 0 && offset[2] > 0) x = -1;
        const l = Math.sqrt(offset[0] * offset[0] + offset[2] * offset[2]);
        const a = arcctg(offset[2] / offset[0]);
        angle *= Math.PI / 180;
        angle += !!a ? a : 0;
        return [x * l * customScale * Math.sin(angle), offset[1] * customScale, x * l * customScale * Math.cos(angle)];
    };

    const getPosition = (position, dims, customScale, lockY = true) => {
        console.log(position, dims);
        if (lockY) return [position[0], (dims[1] * customScale) / 2, position[2]];
        return position;
    };

    const getObjects = () => (
        <Suspense fallback={null}>
            {objects.map((object, index) => {
                if (mode == 'lock')
                    return (
                        <BoundingBox
                            key={'boundingBox' + object.createTime.toString()}
                            dims={object.calcDims}
                            mass={object.mass}
                            isEditting={focusedObject != null}
                            offset={object.calcOffset}
                            position={object.calcPosition}
                            rotation={object.calcRotation}
                        >
                            <Model
                                setFocusedObject={() => {
                                    console.log(object);
                                    if (mode == 'edit') setFocusedObject(object);
                                }}
                                key={object.createTime.toString()}
                                rotation={object.calcRotation}
                                scale={object.calcScale}
                                path={object.url}
                            ></Model>
                        </BoundingBox>
                    );
                return (
                    <Dragable
                        setPosition={(pos) => setPosition(object, pos)}
                        dims={object.calcDims}
                        lockX={object.lockX}
                        lockY={object.lockY}
                        lockZ={object.lockZ}
                        transformGroup
                        key={'dragable' + object.createTime.toString()}
                    >
                        <BoundingBox
                            key={'boundingBox' + object.createTime.toString()}
                            dims={object.calcDims}
                            mass={object.mass}
                            isEditting={focusedObject != null}
                            offset={object.calcOffset}
                            position={object.calcPosition}
                            rotation={object.calcRotation}
                        >
                            <Model
                                setFocusedObject={() => {
                                    console.log(object);
                                    if (mode == 'edit') setFocusedObject(object);
                                }}
                                key={object.createTime.toString()}
                                rotation={object.calcRotation}
                                scale={object.calcScale}
                                path={object.url}
                            ></Model>
                        </BoundingBox>
                    </Dragable>
                );
            })}
        </Suspense>
    );

    const getWalls = () => (
        <Suspense fallback={null}>
            {walls.map((wall, index) => (
                <Wall
                    placeObject={placeObject}
                    key={'wall' + index.toString()}
                    texture={wall.texture}
                    color={wall.color}
                    args={wall.args}
                    position={wall.pos}
                ></Wall>
            ))}
        </Suspense>
    );

    const clearFocused = () => setFocusedObject(null);

    const deleteFocused = () => {
        setObjects(objects.filter((obj) => obj != focusedObject));
        setFocusedObject(null);
    };

    console.log('APP RENDERING.......');

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            {/* <ColorPicker></ColorPicker> */}
            {/* <CameraButton></CameraButton> */}
            <FloatingButtons
                importData={importData}
                exportData={exportData}
                mode={mode}
                setMode={setMode}
                addModel={addModel}
                createWallHandle={createWallHandle}
            ></FloatingButtons>
            <ObjectDetails
                rotateObject={(e) => rotateObject(focusedObject, e)}
                scaleObject={(e) => scaleObject(focusedObject, e)}
                mode={mode}
                object={focusedObject}
                deleteFocused={deleteFocused}
                clearFocused={clearFocused}
            ></ObjectDetails>
            <Canvas shadows style={{ background: 'black' }} camera={{ position: [7, 7, 7] }}>
                {/* <CameraControls></CameraControls> */}
                <Orbit></Orbit>
                {/* <axesHelper args={[5]}></axesHelper> */}
                {/* <Suspense fallback={null}>
                    <Background></Background>
                </Suspense> */}
                <Lights></Lights>
                {/* <gridHelper args={[20, 20]} /> */}
                <Physics>
                    {/* <Car></Car> */}
                    {/* <Dragable>
                        <Suspense fallback={null}>
                            <Box position={[-1.2, 0.5, -2]} />
                        </Suspense>
                        <Suspense fallback={null}>
                            <Box position={[1.2, 0.5, -2]} />
                        </Suspense>
                    </Dragable> */}
                    {getWalls()}
                    {getObjects()}
                </Physics>
            </Canvas>
        </div>
    );
}

export default App;
