/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var $ = require("jquery");
  var React = require("react");

  var Annotate = require("jsx!./annotate");
  var Minimap = require("jsx!./minimap");
  var Page = require("jsx!./page");
  var TextUtil = require("../helpers/textUtil");

  var Document = React.createClass({
    hasScrolled: false,
    getInitialState: function() {
      return { $viewer: null,  };
    },
    toggleHighlights: function(e, uuid) {
      var $annotations = this.state.$viewer.find("[data-uuid*="+uuid+"]");
      $annotations.toggleClass("highlight");
    },
    scrollTo: function(uuid, callback) {
      var $viewer = this.state.$viewer;
      if($viewer) {
        var annotation = $viewer.find("[data-uuid*="+ uuid + "]");
        if(annotation.offset()) {
          var delta = annotation.offset().top;
          var viewerHeight = $viewer.height();
          var center = viewerHeight / 2;
          var isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
          if(!isSmoothScrollSupported) {
            $viewer.animate({scrollTop: $viewer.scrollTop() + delta - center}, "swing", callback || _.identity);
          } else {
            $viewer.scrollTop($viewer.scrollTop() + delta - center);
            (callback || _.identity)();
          }
          return true;
        }
      }
      return false;
    },
    componentWillUnmount: function() {
      $(window).off("highlight", this.toggleHighlights);
      this.props.marginalia.off("annotations:select", this.scrollTo);
    },
    componentDidMount: function() {
      $(window).on("highlight", this.toggleHighlights);
      this.props.marginalia.on("annotations:select", this.scrollTo);

      var $viewer = $(this.refs.viewer);
      this.setState({$viewer: $viewer});
    },
    componentDidUpdate: function() {
      var self = this;
      var uuid = this.props.pdf.get("scrollTo");
      if(uuid && !this.hasScrolled) {
        var scroll = this.scrollTo(uuid, function() {
          self.toggleHighlights(null, uuid);
          _.delay(function() {
            self.toggleHighlights(null, uuid); // reset to off
          }, 2000); // after 2 seconds
        });
        if(scroll) {
          this.hasScrolled = true;
        }
      }
    },
    render: function() {
      var pdf = this.props.pdf;
      var marginalia = this.props.marginalia;

      var fingerprint = pdf.get("fingerprint");
      var pages = pdf.get("pages");

      var annotations = pages.map(function(page, index) {
        return page.get("annotations");
      });

      var pagesElements = pdf.get("pages").map(function(page, pageIndex) {
        return (<Page page={page} key={fingerprint + pageIndex} annotations={annotations[pageIndex]} />);
      });

      return(
        <div>
          <Minimap $viewer={this.state.$viewer} pdf={pdf} annotations={annotations} />
          <div className="viewer-container">
            <div className="viewer" ref="viewer">
               {this.props.isEditable ? <Annotate marginalia={marginalia} /> : null}
               {pagesElements}
             </div>
           </div>
        </div>);
    }
  });

  return Document;
});
