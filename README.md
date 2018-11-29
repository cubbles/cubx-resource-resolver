# cubx-resource-resolver
# Features

Purpose to optimize the loading of Cubbles resources in the browser.
- Download and merge to a single file all direct referenced javascript resources  
- Download and merge to a singe file the html import files and include the merged javascript file
- Download and merge to a single file in the the html import referenced javascript files
- Download and merge to a single file all css resource. (Direct referenced css as well as in the html import file referenced resources )  
 


# Installing

Using npm:

```bash
$ npm install cubx-resource-resolver
```
# Usage

1. Configure CRC: disable resource 
```bash
window.cubx.CRCInit.disableResourceInjection = true;
```

2\. Download and Merge all resources 

* with cli: 
```bash
cubx-resource-resolver -i test\input\artifactList.json -o test\output\ -b https://cubbles.world/pcp-sandbox/ -m dev
``` 
* in jnodejs code

```javascript
async function resolve() {
  let baseUrl = 'https://cubbles.world/sandbox/'
  let resourceList = [
    {
      path: baseUrl + 'example@1.0.0/example-artifact-1/example-artifact-1.html',
      type: 'htmlImport'
    },
    {
      path: baseUrl + 'example@1.0.0/example-artifact-1/styles/example.css',
      type: 'stylesheet'
    },
    {
      path: baseUrl + 'example@1.0.0/example-artifact-2/example-artifact-2.html',
      type: 'htmlImport'
    },
    {
      path: baseUrl + 'example@1.0.0/util1/js/util.js',
      type: 'javascript'
    }
  ];
  
  await resourceResolver.resolve(resourceList, 'output', baseUrl);
}
```
3\. Load resources after CRC resolved dependencies and fire 'depMgrReady' event manually.   
```html
<script>
  document.addEventListener('crcBeforeResourceInjection', function (evt) {
    // add scripts
    var element = document.createElement('script');
    element.setAttribute('src', '/output/scripts.js'?>');
    element.async = false;
    document.head.appendChild(element);
    // add styles
    element = document.createElement('link');
    element.setAttribute('rel', 'stylesheet');
    element.setAttribute('href', '/output/styles.css'?>');
    document.head.appendChild(element);
  
    // add templates
    element = document.createElement('link');
    element.setAttribute('rel', 'import');
    element.setAttribute('href', '/output/html-imports.html'?>');
    document.head.appendChild(element);
    // fire event for CRC, that this can continue work and not longer waiting
    window.cubx.CRC.fireDepMgrReadyEvent();
  });
</script>
```

___Hint:__ The resource list can generated with the npm modul `cubx-dependency-resolver`. Use the #resolveResourcesList Method._

__Attention:__ Exclude Polymer resources, and add separatly after the reference of webcomponent script and cubx.core.rte@2.6.0/crcLoader/main.js reference, but before other cubbles references. This will be work by minimum rte version 2.6.0.  

