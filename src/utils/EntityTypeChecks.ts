/**
 * User-defined type guards for BidEntity types
 */

import BidEntity from "@/domain/BidEntity";
import Bid from "@/domain/Bid";
import DynamicGroup from "@/domain/DynamicGroup";
import Component from "@/domain/Component";
import LineItem from "@/domain/LineItem";
import Field from "@/domain/Field";
import Metric from "@/domain/Metric";
import ComponentGroup from "@/domain/ComponentGroup";
import FieldGroup from "@/domain/FieldGroup";
import Datatable from "@/domain/Datatable";
import Assembly from "@/domain/Assembly";
import Project from "@/domain/Project";

export const isBid = (entity: BidEntity): entity is Bid => entity.type === "bid";
export const isDynamicGroup = (entity: BidEntity): entity is DynamicGroup => entity.type === "dynamic_group";
export const isComponent = (entity: BidEntity): entity is Component => entity.type === "component";
export const isLineItem = (entity: BidEntity): entity is LineItem => entity.type === "line_item";
export const isField = (entity: BidEntity): entity is Field => entity.type === "field";
export const isMetric = (entity: BidEntity): entity is Metric => entity.type === "metric";
export const isComponentGroup = (entity: BidEntity): entity is ComponentGroup =>
  entity.type === "component_group";
export const isFieldGroup = (entity: BidEntity): entity is FieldGroup => entity.type === "field_group";
export const isDatatable = (entity: BidEntity): entity is Datatable => entity.type === "datatable";
export const isAssembly = (entity: BidEntity): entity is Assembly => entity.type === "assembly";
export const isProject = (entity: BidEntity): entity is Project => entity.type === "project";
