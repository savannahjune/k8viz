# k8viz

### Visualization of K8 Cluster for Heptio

#### To use the app locally:

```javascript
1.  clone the repo
2.  npm install
3.  npm run dev
4.  open localhost:3000
```

You can add pods to nodes, capped at 3 pods per node. If you mouseover a part of the cluster, you will see info about the role that part plays in the cluster.

#### Development:

If you make changes, the app will rebuild and reload if there are no build issues.

##### Todo's:

- break up updateTreeStructure()
- allow user to set amount of pods per node
