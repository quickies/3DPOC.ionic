import {Component, Input} from '@angular/core';
import {STLLoader} from "./stlloader";

import {
  Object3D,
  PerspectiveCamera,
  Scene,
  Mesh,
  WebGLRenderer,
  Vector3,
  SpotLight,
  MeshLambertMaterial,
  Color,
} from "three"

@Component({
  selector: 'three-d',
  templateUrl: 'three-d.html'
})

export class ThreeDComponent {

  _stlURL: string;

  @Input()
  set stlURL(url: string) {
    this._stlURL = url;
    this.init3D();
  }

  constructor() {
    console.log("threee-3d");
  }

  ionViewDidLoad(){
    this.init3D();
  }

  init3D() {
    // create a scene, that will hold all our elements such as objects, cameras and lights.
    let scene = new Scene();

    // create a camera, which defines where we're looking at.
    let height = window.innerHeight - 150;
    let camera = new PerspectiveCamera(45, window.innerWidth / height, 0.1, 1000);

    // create a render and set the size
    let webGLRenderer = new WebGLRenderer();
    webGLRenderer.setClearColor(new Color('black'));
    webGLRenderer.setSize(window.innerWidth, height);
    webGLRenderer.shadowMapEnabled = true;

    // position and point the camera to the center of the scene
    camera.position.x = 150;
    camera.position.y = 150;
    camera.position.z = 150;
    camera.lookAt(new Vector3(0, 40, 0));

    // add spotlight for the shadows
    let spotLight = new SpotLight(0xffffff);
    spotLight.position.set(150, 150, 150);
    scene.add(spotLight);

    // add the output of the renderer to the html element
    document.getElementById("WebGL-output").appendChild(webGLRenderer.domElement);
    console.log("Starting 3D");

    // call the render function
    let step = 0;

    // model from http://www.thingiverse.com/thing:69709
    let loader = new STLLoader();
    let group = new Object3D();

    loader.load(this._stlURL, function (geometry) {
      console.log(geometry);
      var mat = new MeshLambertMaterial({color: 'white'});
      group = new Mesh(geometry, mat);
      group.rotation.x = -0.5 * Math.PI;
      group.scale.set(2, 2, 2);
      scene.add(group);
    }, function(){}, function(){});
    render();


    function render() {
      // stats.update();

      if (group) {
        group.rotation.z += 0.006;
        // group.rotation.x+=0.006;
      }

      // render using requestAnimationFrame
      requestAnimationFrame(render);
      webGLRenderer.render(scene, camera);
    }
  }
}
