require.config({
    paths: {
        jquery: '/assets/libs/jQuery/jquery-2.2.3',
        three: '/assets/libs/three/js/three',
        Layer: '/assets/libs/jQuery/layer/layer',
        stats: '/assets/libs/three/js/stats.min',
        datGui: '/assets/libs/three/js/dat.gui',

        ShadowMaterial: '/assets/libs/three/js/materials/ShadowMaterial',
        OrbitControls: '/assets/libs/three/js/controls/OrbitControls',
        TransformControls: '/assets/libs/three/js/controls/TransformControls',
        Projector: '/assets/libs/three/js/Projector',

        loadScene: '/assets/js/three/loadScene',
        model: '/assets/js/three/model',
        class: '/assets/js/three/class',
        VRControls: '/assets/libs/three/js/vr/VRControls',
        VREffect: '/assets/libs/three/js/vr/VREffect',
        webvrPolyfill: '/assets/libs/three/js/vr/webvr-polyfill'

    },
    shim: {
        three: {
            exports: 'THREE'
        },

        // thrreJs user code
        // 依赖关系：operate << loadScene << class << model
        "model" : ['three','jquery','Layer'],
        "class": ['model'],

        // jQuery libs
        "Layer" : ['jquery'],

        //threejs libs
        "ShadowMaterial": ['three'],
        "OrbitControls": ['three'],
        "TransformControls": ['three'],
        "Projector": ['three'],

        "VRControls": ['three','webvrPolyfill'],
        "VREffect": ['three','webvrPolyfill'],
        'webvrPolyfill': {
　　　　　　deps: ['three']
　　　　  }
        
    }
});

require([
    'jquery','three','stats','datGui',
    'ShadowMaterial','OrbitControls','TransformControls','Projector',
    'model',
    'VRControls','VREffect','webvrPolyfill'
    ],
function($, THREE) {

        var container, stats;
        var camera, controls, scene, renderer;
        var objects = [], plane;
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2(),
        offset = new THREE.Vector3(),
        INTERSECTED, SELECTED;

        var vrEffect;
        var vrControls;
        // 初始化FPS状态栏
        var stats = initStats();
        function initStats() {

            var stats = new Stats();
                stats.setMode(0); // 0: fps, 1: ms
                // Align top-left
                stats.domElement.style.position = 'absolute';
                stats.domElement.style.left = '0px';
                stats.domElement.style.top = '0px';
                document.getElementById("Stats-output").appendChild(stats.domElement);
                return stats;
        }
        

        // 创建场景             
        var scene = new THREE.Scene();

        // 新建相机，并且添加至场景 
        $('#VR').css("width",($(window).width())+"px");
        $('#VR').css("height",($(window).height())+"px");
        var camera = new THREE.PerspectiveCamera(70, $('#VR').width() / $('#VR').height(), 1, 20000);
        scene.add(camera);


        // vr
        crosshair = new THREE.Mesh(
            new THREE.RingGeometry( 0.5, 1, 32 ),
            new THREE.MeshBasicMaterial( {
                color: 0x00bb00,
                transparent: true,
                opacity: 0.5
            } )
        );
        scene.add( crosshair );


        // 渲染并且设置场景大小 
        var renderer = new THREE.WebGLRenderer({
            antialias:true,
            preserveDrawingBuffer: true});
        renderer.setClearColor(new THREE.Color(0xfafafa, 1.0));
        // renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize($('#VR').width(), $('#VR').height());
        
        // 视图控制 
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.zoomSpeed = 2;
        controls.addEventListener( 'change', render );
        
        // vr
        var fullScreenButton = document.querySelector( '.full-screen' );

        if ( navigator.getVRDevices === undefined ) {

            fullScreenButton.innerHTML = 'Your browser doesn\'t support WebVR';
            fullScreenButton.classList.add('error');

        }

        vrControls = new THREE.VRControls( camera );
        vrEffect = new THREE.VREffect( renderer, function ( error ) {

            fullScreenButton.innerHTML = error;
            fullScreenButton.classList.add('error');

        } );

        fullScreenButton.onclick = function() {

            vrEffect.setFullScreen( true );

        };

        //创建线条基面
        var size = 100, step = 1 , step2 = 10,step3 = 100;
        var geometry1 = new THREE.Geometry();
        for ( var i = - size; i <= size; i += step ) {
            geometry1.vertices.push( new THREE.Vector3( - size, 0, i ) );
            geometry1.vertices.push( new THREE.Vector3(   size, 0, i ) );
            geometry1.vertices.push( new THREE.Vector3( i, 0, - size ) );
            geometry1.vertices.push( new THREE.Vector3( i, 0,   size ) );

        }
        var material = new THREE.LineBasicMaterial( { color: 0x007fff, opacity: 0.1, transparent: true } );
        var line = new THREE.LineSegments( geometry1, material );
        scene.add( line );

        var geometry2 = new THREE.Geometry();
        for ( var i = - size; i <= size; i += step2 ) {
            geometry2.vertices.push( new THREE.Vector3( - size, 0, i ) );
            geometry2.vertices.push( new THREE.Vector3(   size, 0, i ) );
            geometry2.vertices.push( new THREE.Vector3( i, 0, - size ) );
            geometry2.vertices.push( new THREE.Vector3( i, 0,   size ) );

        }
        var material = new THREE.LineBasicMaterial( { color: 0x4d4dff, opacity: 0.6, transparent: true } );
        var line2 = new THREE.LineSegments( geometry2, material );
        scene.add( line2 );
        
        var geometry3 = new THREE.Geometry();
        for ( var i = - size; i <= size; i += step3 ) {
            geometry3.vertices.push( new THREE.Vector3( - size, 0, i ) );
            geometry3.vertices.push( new THREE.Vector3(   size, 0, i ) );
            geometry3.vertices.push( new THREE.Vector3( i, 0, - size ) );
            geometry3.vertices.push( new THREE.Vector3( i, 0,   size ) );

        }
        var material = new THREE.LineBasicMaterial( { color: 0x4d4d4d, opacity: 1, transparent: true } );
        var line3 = new THREE.LineSegments( geometry3, material );
        scene.add( line3 );
        // 创建隐藏平面用于定位
        var geometry = new THREE.PlaneBufferGeometry( 600, 600 );
        geometry.rotateX( - Math.PI / 2 );
        plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
        plane.able = 'false';
        scene.add( plane );
        objects.push( plane );
        

        

        // 设置相机位置，并且定义方向 
        camera.position.x = 0;
        camera.position.y = 10;
        camera.position.z = 10;
        camera.lookAt(scene.position);
        

        // 添加灯光       
        var light = new Array();
        var lightDistance = 400;
        lightX =[0,   0,    lightDistance, -lightDistance, 0,     0];
        lightY =[lightDistance,-lightDistance,0,    0,     0,     0];
        lightZ =[0,   0,    0,    0,     lightDistance,  -lightDistance]
        lightIntensity = [1, 0.85, 0.7, 0.75 , 0.8, 0.75];
        for(var i =0; i<6;i++){
            light[i] = new THREE.DirectionalLight(0xffffff);
            light[i].position.set(lightX[i], lightY[i], lightZ[i]);
            light[i].castShadow = false;
            light[i].shadow.camera.near = 2;
            light[i].shadow.camera.far = 2000;
            light[i].shadow.camera.left = -1000;
            light[i].shadow.camera.right = 1000;
            light[i].shadow.camera.top = 1000;
            light[i].shadow.camera.bottom = -1000;
            light[i].distance = 0;
            light[i].intensity = lightIntensity[i];
            light[i].shadow.mapSize.width = 1024;
            light[i].shadow.mapSize.height = 1024;
            scene.add(light[i]);
            // var test = new THREE.DirectionalLightHelper( light[i],100);
            // scene.add(test) ;
        }
        



        // 添加渲染DOM节点
        container = document.getElementById("VR").appendChild(renderer.domElement);

        window.addEventListener( 'resize', onWindowResize, false );
        function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            vrEffect.setSize( window.innerWidth, window.innerHeight );

        }

            
        // 场景渲染定义
        function animate() {

             requestAnimationFrame( animate );
             stats.update();
             render();

             // transformControl.update();
        }
        function render() {

            renderer.render(scene, camera);

            vrControls.update();

            crosshair.quaternion.copy( camera.quaternion );
            crosshair.position.set( 0, 0, 0 );

            vrEffect.render( scene, camera );
        }
        render();
        animate();

});