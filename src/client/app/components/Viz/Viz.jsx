import React from 'react';
import * as d3 from 'd3';
import styles from './Viz.css';


class Viz extends React.Component {

  constructor(props) {
    super(props);

    this.createD3Graph = this.createD3Graph.bind(this);

    this.updateTreeStructure = this.updateTreeStructure.bind(this);
    this.addNodes = this.addNodes.bind(this);

    this.state = {
      k8Data: {
        "name": "Kubernetes API",
        "class": "kube-api",
        "info": "The API server is a key component and serves the Kubernetes API using JSON over HTTP, which provides both the internal and external interface to Kubernetes.",
        "children": [
          {
            "name": "Controller",
            "class": "kube-controller",
            "info": "A controller is a reconciliation loop that drives actual cluster state toward the desired cluster state.",
            "children": [
              {
                "name": "Scheduler",
                "class": "kube-scheduler",
                "info" : "The scheduler is the pluggable component that selects which node an unscheduled pod (the basic entity managed by the scheduler) should run on based on resource availability.",
                "children": []
              }
            ]
          }
        ]
      },
      numPods: 10
    };


    this.margin = {top: 20, right: 90, bottom: 10, left: 140}
    this.width = 960 - this.margin.left - this.margin.right,
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.svg;
    this.root;

    this.duration = 1000;
  }

  componentDidMount() {
    this.createD3Graph();
    this.addNodes(['Node 1', 'Node 2', 'Node 3']);
    this.addPods(['Pod 1', 'Pod 2', 'Pod 3', 'Pod 4', 'Pod 5', 'Pod 6', 'Pod 7', 'Pod 8', 'Pod 9', 'Pod 10'])
    this.updateTreeStructure();
  }

  componentDidUpdate() {
    this.updateTreeStructure();
  }

  addNodes(names) {
    let scheduler = this.getScheduler();

    for (var index = 0; index < names.length; index++) {
      let newNode = {
        name: names[index],
        class: 'kube-node',
        info: 'A nodes is the single machine (or virtual machine) where pods are deployed.',
        children: []
      }
      scheduler['children'].push(newNode);
    }

    this.setState(this.state);
  }

  getScheduler() {
    let rootState = this.state;
    let controller = rootState.k8Data['children'][0];
    let scheduler = controller['children'][0];

    return scheduler;
  }

  addPods(podNames) {
    // TODO : Make this a class attribute or give each Node a max-pods attribute
    let MAX_PODS_PER_NODE = 3;

    let scheduler = this.getScheduler();
    var nodeCount = scheduler['children'].length;
    var nodeIndex = 0;

    var node = scheduler['children'][nodeIndex];

    for (var podIndex = 0; podIndex < podNames.length; podIndex++) {

      let nodePodCount = node['children'].length;
      while (nodePodCount === MAX_PODS_PER_NODE) {

        if (nodeIndex < nodeCount - 1) { // If node exists
          // Schedule on the next available node
          node = scheduler['children'][++nodeIndex];
          nodePodCount = node['children'].length;
        } else  { // We need to create a new Node to fit this pod
          let newNode = {
            name: 'Node ' + (++nodeIndex),
            class: 'kube-node',
            info: 'A nodes is the single machine (or virtual machine) where pods are deployed.',
            children: []
          };
          scheduler['children'].push(newNode);
          node = newNode;
          nodeCount++;
          nodePodCount = 0;
        }
      }

      // Add pod to current node
      node['children'].push({
        name: podNames[podIndex],
        class: 'kube-pod',
        info: 'The basic scheduling unit in Kubernetes is called a "pod". It adds a higher level of abstraction to containerized components. A pod consists of one or more containers that are guaranteed to be co-located on the host machine and can share resources.',
        children: []
      });
    }

    this.state.numPods = this.state.numPods + 1;
    this.setState(this.state);
  }

  createD3Graph() {
    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg = d3.select('#viz-svg').append('svg')
        .attr('width', this.width + this.margin.right + this.margin.left)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
        .attr('transform', 'translate('
              + this.margin.left + ',' + this.margin.top + ')');

    this.updateTreeStructure();
  }

  updateTreeStructure() {
    // Clear existing nodes before replacing with new graph
    this.svg.selectAll('.node').remove();

    // Assigns parent, children, height, depth
    this.root = d3.hierarchy(this.state.k8Data, function(d) { return d.children; });
    this.root.x0 = this.height / 2;
    this.root.y0 = 0;

    var i = 0;

    // declares a tree layout and assigns the size
    var treemap = d3.tree().size([this.height, this.width]);

    // Assigns the x and y position for the nodes
    var treeData = treemap(this.root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function(d){ d.y = d.depth * 180});

    // Update the nodes...
    var node = this.svg.selectAll('g.node')
        .data(nodes, function(d) {return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var root = this.root;

    // Add tooltips for nodes
    var tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('opacity', 0);

    var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', function(d) {
        return 'translate(' + root.y0 + ',' + root.x0 + ')'
      })
      .on('mouseover', () => {
        console.log('event firing');
        return tooltip.style('opacity', 1);
      })
      .on('mousemove', (d) => {
        return tooltip.text(d.data.info);
      })
      .on('mouseout', () => {
        return tooltip.style('opacity', 0);
      });

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', function(d) {
          if (d.data.class === undefined) {
            return 'node';
          } else {
            return 'node ' + d.data.class;
          }
        })
        .attr('r', 1e-6);

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr('dy', '-0.5em') // Place slightly to upper left/right
        .attr('x', function(d) {
            return d.children || d._children ? -13 : 13;
        })
        .attr('text-anchor', function(d) {
            return d.children || d._children ? 'end' : 'start';
        })
        .text(function(d) { return d.data.name; });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(this.duration)
      .attr('transform', function(d) {
          return 'translate(' + d.y + ',' + d.x + ')';
       });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(this.duration)
        .attr('transform', function(d) {
            return 'translate(' + root.y + ',' + root.x + ')';
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // Update the links...
    var link = this.svg.selectAll('path.link')
        .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', function(d){
          var o = {x: root.x0, y: root.y0}
          return diagonal(o, o)
        });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(this.duration)
        .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(this.duration)
        .attr('d', function(d) {
          var o = {x: root.x, y: root.y}
          return diagonal(o, o);
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d){
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(source, destination) {

      var path = `M ${source.y} ${source.x}
                  C ${(source.y + destination.y) / 2} ${source.x},
                    ${(source.y + destination.y) / 2} ${destination.x},
                    ${destination.y} ${destination.x}`

      return path;
    }
  }

  render() {
    return (
      <div>
        <div className="header">
          <div className="company-label">Heptio Kubernetes Viz</div>
            <div className="addButton" onClick={() => {this.addPods(['Pod ' + (this.state.numPods)])}}>
              Add a Pod
            </div>
        </div>
        <div id="viz-svg"></div>
      </div>
    )

  }
}
export default Viz;
