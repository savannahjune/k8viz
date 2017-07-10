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
      k8Data:
      {
        "name": "Kubernetes API",
        "children":
        [
          {
            "name": "Controller",
            "class": "kube-controller",
            "children": [
              {
                "name": "Scheduler",
                "class": "kube-scheduler",
                "children": [
                  {
                    "name": "Node 1",
                    "class": "kube-node",
                    "children":
                    [
                      {
                        "name": "Node 1 - Pod 1",
                        "class": "kube-pod",
                      },
                      {
                        "name": "Node 1 - Pod 2",
                        "class": "kube-pod",
                      }
                    ]
                  },
                  {
                    "name": "Node 2",
                    "class": "kube-node",
                    "children":
                    [
                      {
                        "name": "Node 2 - Pod 1",
                        "class": "kube-pod",
                      },
                      {
                        "name": "Node 2 - Pod 2",
                        "class": "kube-pod",
                      }
                    ]
                  }
                ]
              },
            ]
          },
        ]
      }
    }


    this.margin = {top: 20, right: 90, bottom: 30, left: 140}
    this.width = 960 - this.margin.left - this.margin.right,
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.svg = undefined;
    this.root = undefined;

    this.duration = 750;
  }

  componentDidMount() {
    this.createD3Graph();
    // let scheduler = this.state.k8Data['children'][0]['children'][0];
    // this.addNodes(['Node 1', 'Node 2'], scheduler);
    // this.updateTreeStructure();
  }

  componentDidUpdate() {
    this.updateTreeStructure();
  }

  addNodes(names, scheduler) {
    console.log('scheduler before', scheduler);
    for (var index = 0; index < names.length; index++) {
      scheduler['children'].push({
        name: names[index],
        children: []
      });
    }

    console.log('scheduler after', scheduler);
    this.setState({k8Data: scheduler});
  }

  addPods() {

  }

  createD3Graph() {
    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg = d3.select("#area").append("svg")
        .attr("width", this.width + this.margin.right + this.margin.left)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate("
              + this.margin.left + "," + this.margin.top + ")");


    // Assigns parent, children, height, depth
    this.root = d3.hierarchy(this.state.k8Data, function(d) { return d.children; });
    this.root.x0 = this.height / 2;
    this.root.y0 = 0;

    this.updateTreeStructure();
  }

  updateTreeStructure() {
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

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = this.svg.selectAll('g.node')
        .data(nodes, function(d) {return d.id || (d.id = ++i); });

    // Enter any new modes at the parent's previous position.
    var root = this.root;
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function(d) {
          return "translate(" + root.y0 + "," + root.x0 + ")";
      })
      .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', function(d) {
          if (d.data.class === undefined) {
            return "node";
          } else {
            return "node " + d.data.class;
          }
        })
        .attr('r', 1e-6);

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", function(d) {
            return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function(d) { return d.data.name; });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(this.duration)
      .attr("transform", function(d) {
          return "translate(" + d.y + "," + d.x + ")";
       });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      })
      .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(this.duration)
        .attr("transform", function(d) {
            return "translate(" + root.y + "," + root.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = this.svg.selectAll('path.link')
        .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
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
          return diagonal(o, o)
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

      return path
    }

      // Toggle children on click.
      function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
        update(d);
      }
  }

  render() {
    return <div id="area"/>
  }
}
export default Viz;
