'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('TreeCtrl', ['$anchorScroll' , '$q', '$filter', '$location', '$uibModal', '$scope', '$rootScope', '$state','$timeout', 'growl', 
                          'UxService', 'ElementService', 'UtilsService', 'ViewService', 'ProjectService', 'MmsAppUtils', 'documentOb', 'viewOb',
                          'orgOb', 'projectOb', 'refOb', 'refObs', 'groupObs', 'documentObs',
function($anchorScroll, $q, $filter, $location, $uibModal, $scope, $rootScope, $state, $timeout, growl, 
    UxService, ElementService, UtilsService, ViewService, ProjectService, MmsAppUtils, documentOb, viewOb,
    orgOb, projectOb, refOb, refObs, groupObs, documentObs) {

    $rootScope.mms_refOb = refOb;
    $rootScope.mms_bbApi = $scope.bbApi = {};
    $rootScope.mms_treeApi = $scope.treeApi = {};
    if (!$rootScope.veTreeShowPe)
        $rootScope.veTreeShowPe = false;
    $scope.buttons = [];
    $scope.treeExpandLevel = 1;
    if ($state.includes('project.ref') && !$state.includes('project.ref.document')) 
        $scope.treeExpandLevel = 0;
    $scope.treeSectionNumbering = false;
    if ($state.includes('project.ref.document')) {
        $scope.treeSectionNumbering = true;
        $scope.treeExpandLevel = 3;
    }
    $rootScope.ve_fullDocMode = false;
    if ($state.includes('project.ref.document.full'))
        $rootScope.ve_fullDocMode = true;
    $scope.treeFilter = {search: ''};
    var docEditable = documentOb && documentOb._editable && refOb && !refOb.isTag && UtilsService.isView(documentOb);

    var wsPerms = refOb.workspaceOperationsPermission; //TODO still needed?

    $scope.bbApi.init = function() {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-expand"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-collapse"));

        if ($state.includes('project') && !$state.includes('project.ref')) {
            //$scope.bbApi.addButton(UxService.getButtonBarButton("tree-merge"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-task"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-configuration"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete"));
            $scope.bbApi.setPermission("tree-add-task", wsPerms);
            $scope.bbApi.setPermission("tree-delete", wsPerms);
            //$scope.bbApi.setPermission("tree-merge", $scope.wsPerms);
        } else if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-document"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete-document"));
            $scope.bbApi.setPermission("tree-add-document", refOb.isTag ? true : false);
            $scope.bbApi.setPermission("tree-delete-document", refOb.isTag ? true : false);
        } else if ($state.includes('project.ref.document')) {
            $scope.bbApi.addButton(UxService.getButtonBarButton("view-mode-dropdown"));
            $scope.bbApi.setToggleState('tree-show-pe', $rootScope.veTreeShowPe);
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-reorder-view"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-full-document"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-view"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete-view"));
            $scope.bbApi.setPermission("tree-add-view", docEditable);
            $scope.bbApi.setPermission("tree-reorder-view", docEditable);
            $scope.bbApi.setPermission("tree-delete-view", docEditable);
            if ($rootScope.ve_fullDocMode) {
                $scope.bbApi.setToggleState('tree-full-document', true);
            }
        }
    };

    $scope.$on('tree-expand', function() {
        $scope.treeApi.expand_all();
    });

    $scope.$on('tree-collapse', function() {
        $scope.treeApi.collapse_all();
    });

    $scope.$on('tree-filter', function() {
        $scope.toggleFilter();
    });

    $scope.$on('tree-add-task', function() {
        addItem('Branch');
    });

    $scope.$on('tree-add-configuration', function() {
        addItem('Tag');
    });

    $scope.$on('tree-add-document', function() {
        addItem('Document');
    });

    $scope.$on('tree-delete-document', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree-add-view', function() {
        addItem('View');
    });

    $scope.$on('tree-delete', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree-delete-view', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree-merge', function() {
        $scope.mergeAssist();
    });

    $scope.$on('tree-reorder-view', function() {
        $rootScope.ve_fullDocMode = false;
        $scope.bbApi.setToggleState("tree-full-document", false);
        $state.go('project.ref.document.order', {search: undefined});
    });

    $scope.$on('tree-show-pe', function() {
        toggle('showTree');
        $rootScope.veTreeShowPe = true;
        setPeVisibility(viewId2node[documentOb.sysmlId]);
        $scope.treeApi.refresh();
    });

    $scope.$on('tree-show-views', function() {
        toggle('showTree');
        $rootScope.veTreeShowPe = false;
        setPeVisibility(viewId2node[documentOb.sysmlId]);
        $scope.treeApi.refresh();
    });

    $scope.tableList = [];
    $scope.figureList = [];
    $scope.equationList = [];
    $scope.treeViewModes = [{
        id: 'table',
        title: 'Tables',
        icon: 'fa-table',
        branchList: $scope.tableList
    }, {
        id: 'figure',
        title: 'Figures',
        icon: 'fa-image',
        branchList: $scope.figureList
    }, {
        id: 'equation',
        title: 'Equations',
        icon: 'fa-superscript',
        branchList: $scope.equationList
    }];

    var toggle = function (id) {
        $scope.activeMenu = id;
    };
    // Set active tree view to tree
    toggle('showTree');

    $scope.$on('tree-show-tables', function() {
        toggle('table');
    });
    $scope.$on('tree-show-figures', function() {
        toggle('figure');
    });
    $scope.$on('tree-show-equations', function() {
        toggle('equation');
    });

    // Get a list of specific PE type from branch
    function getPeTreeList(branch, type, list) {
        if ( branch.type === type) {
            list.push(branch);
        }
        for (var i = 0; i < branch.children.length; i++) {
            getPeTreeList(branch.children[i], type, list);
        }
    }

    // Function to refresh table and figure list when new item added, deleted or reordered
    function resetPeTreeList(elemType) {
        if (elemType == 'table' || elemType == 'all') {
            $scope.tableList.length = 0;
            getPeTreeList(viewId2node[documentOb.sysmlId], 'table', $scope.tableList);
        }
        if (elemType == 'figure' || elemType == 'image' || elemType == 'all') {
            $scope.figureList.length = 0;
            getPeTreeList(viewId2node[documentOb.sysmlId], 'figure', $scope.figureList);
        }
        if (elemType == 'equation' || elemType == 'all') {
            $scope.equationList.length = 0;
            getPeTreeList(viewId2node[documentOb.sysmlId], 'equation', $scope.equationList);
        }
    }

    //TODO fix tag creation
    var creatingSnapshot = false;
    $scope.$on('document-snapshot-create', function() {
        if (creatingSnapshot) {
            growl.info('Please Wait...');
            return;
        }
        creatingSnapshot = true;
        $rootScope.ve_tbApi.toggleButtonSpinner('document-snapshot-create');

        $scope.itemType = 'Tag';
        $scope.createConfigParentId = refOb.id;
        $scope.configuration = {};
        $scope.configuration.now = true;
        var templateUrlStr = 'partials/mms/new-tag.html';
        var branchType = 'configuration';

        var instance = $uibModal.open({
            templateUrl: templateUrlStr,
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', '$filter', addItemCtrl]
        });
        instance.result.then(function(data) {

        }, function(reason) {
            growl.error("Snapshot Creation failed: " + reason.message);
        }).finally(function() {
            creatingSnapshot = false;
            $rootScope.ve_tbApi.toggleButtonSpinner('document-snapshot-create');
        });

        $rootScope.ve_tbApi.select('document-snapshot');
    });

    $scope.$on('tree-full-document', function() {
        $scope.fullDocMode();
    });

    $scope.toggleFilter = function() {
        $scope.bbApi.toggleButtonState('tree-filter');
    };
    /* //TODO refactor merge
    $scope.mergeAssist = function() {
        $rootScope.mergeInfo = {
            pane: 'fromToChooser',
            tree_rows: $rootScope.mms_treeApi.get_rows()
        };

        for (var rowItem in $rootScope.mergeInfo.tree_rows){
            if($rootScope.mms_treeApi.get_parent_branch($rootScope.mergeInfo.tree_rows[rowItem].branch) !== null){
                $rootScope.mergeInfo.tree_rows[rowItem].parentInfo = $rootScope.mms_treeApi.get_parent_branch($rootScope.mergeInfo.tree_rows[rowItem].branch);
            } else {
                $rootScope.mergeInfo.tree_rows[rowItem].parentInfo = null;
            }
        }

        var modalInstance = $uibModal.open({
            templateUrl: 'partials/mms/merge_assistant.html',
            controller: 'WorkspaceMergeAssistant'
        });
    };

    $scope.pickNew = function(source, branch) {
        if (!branch) {
            growl.warning("Select new task or tag to compare");
            return;
        }
        if (source == 'from')
            $scope.mergeFrom = branch;
        if (source == 'to')
            $scope.mergeTo = branch;
    };

    // TODO: Move toggle to button bar api
    $scope.comparing = false;
    $scope.compare = function() {
        if ($scope.comparing) {
            growl.info("Please wait...");
            return;
        }
        if (!$scope.mergeFrom || !$scope.mergeTo) {
            growl.warning("From and To fields must be filled in");
            return;
        }
        var sourceWs = $scope.mergeFrom.data.id;
        var sourceTime = 'latest';
        if ($scope.mergeFrom.type === 'configuration') {
            sourceWs = $scope.mergeFrom.workspace;
            sourceTime = $scope.mergeFrom.data.timestamp;
        }
        var targetWs = $scope.mergeTo.data.id;
        var targetTime = 'latest';
        if ($scope.mergeTo.type === 'configuration') {
            targetWs = $scope.mergeTo.workspace;
            targetTime = $scope.mergeTo.data.timestamp;
        }
        $scope.comparing = true;
        //try background diff
        WorkspaceService.diff(targetWs, sourceWs, targetTime, sourceTime)
        .then(function(data) {
            if (data.status === 'GENERATING') {
                growl.info("tell user to wait for email");
                $scope.comparing = false;
                return;
            }
            $state.go('workspace.diff', {source: sourceWs, target: targetWs, sourceTime: sourceTime, targetTime: targetTime, search: undefined});
        });
    };
 */
    // TODO not needed? tags should be separate from branch in the tree since the parent branch can be deleted
    var refLevel2Func = function(refOb, refNode) {
        refNode.loading = true;
        ProjectService.getConfigs().then (function (data) {
            data.forEach(function (config) {
                var configTreeNode = {
                    label : config.name,
                    type : "configuration",
                    data : config, 
                    workspace: refOb.id,
                    children : [] 
                };

                // check all the children of the workspace to see if any tasks match the timestamp of the config
                // if so add the workspace as a child of the configiration it was tasked from
                for (var i = 0; i < refNode.children.length; i++) {
                    var childWorkspaceTreeNode = refNode.children[i];
                    if (childWorkspaceTreeNode.type === 'workspace') {
                        if (childWorkspaceTreeNode.data.branched === config.commitId) {
                            configTreeNode.children.push(childWorkspaceTreeNode);
                            refNode.children.splice(i, 1);
                            i--;
                        }
                    }
                }
                refNode.children.unshift(configTreeNode); 
            });
            refNode.loading = false;
            if ($scope.treeApi.refresh)
                $scope.treeApi.refresh();
        }, function(reason) {
            growl.error(reason.message);
        });
    };

    var groupLevel2Func = function(groupOb, groupNode) {
        var docs = [];
        var docOb, i;
        for (i = 0; i < documentObs.length; i++) {
            docOb = documentObs[i];
            if (docOb._groupId === groupOb.sysmlId) {
                docs.push(docOb);
            }
        }
        for (i = 0; i < docs.length; i++) {
            docOb = docs[i];
            groupNode.children.unshift({
                label: docOb.name,
                type: refOb.isTag ? 'view' : 'snapshot',
                data: docOb,
                group: groupOb,
                children: []
            });
        }
        if ($scope.treeApi.refresh) {
            $scope.treeApi.refresh();
        }
    };
    
    var viewId2node = {};
    var seenViewIds = {};
    var handleSingleView = function(v, aggr) {
        var curNode = viewId2node[v.sysmlId];
        if (!curNode) {
            curNode = {
                label: v.name,
                type: 'view',
                data: v,
                children: [],
                loading: false,
                aggr: aggr
            };
            viewId2node[v.sysmlId] = curNode;
        }
        return curNode;
    };
    var handleChildren = function(curNode, childNodes) {
        var newChildNodes = [];
        childNodes.forEach(function(node) {
            if (seenViewIds[node.data.sysmlId]) {
                growl.error("Warning: View " + node.data.name + " have multiple parents! Duplicates not shown.");
                return;
            }
            seenViewIds[node.data.sysmlId] = node;
            newChildNodes.push(node);
        });
        curNode.children.push.apply(curNode.children, newChildNodes);
    };
    var processDeletedViewBranch = function(branch) {
        var sysmlId = branch.data.sysmlId;
        if (seenViewIds[sysmlId])
            delete seenViewIds[sysmlId];
        if (viewId2node[sysmlId])
            delete viewId2node[sysmlId];
        for (var i = 0; i < branch.children.length; i++) {
            processDeletedViewBranch(branch.children[i]);
        }
    };
    if ($state.includes('project') && !$state.includes('project.ref')) {
        $scope.treeData = UtilsService.buildTreeHierarchy(refObs, "id", "branch", "parentId");
    } else if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
        $scope.treeData = UtilsService.buildTreeHierarchy(groupObs, "sysmlId", "group", "_parentId", groupLevel2Func);
    } else {
        var seenChild = {};        
        if (!documentOb._childViews)
            documentOb._childViews = [];
        MmsAppUtils.handleChildViews(documentOb, 'composite', projectOb.id, refOb.id, handleSingleView, handleChildren)
        .then(function(node) {
            for (var i in viewId2node) {
                addSectionElements(viewId2node[i].data, viewId2node[i], viewId2node[i]);
            }
            $scope.treeApi.refresh();
        }, function(reason) {
            console.log(reason);
        });
        $scope.treeData = [viewId2node[documentOb.sysmlId]];
    }

    function addSectionElements(element, viewNode, parentNode) {
        var contents = null;

        var addContentsSectionTreeNode = function(operand) {
            var bulkGet = [];
            operand.forEach(function(instanceVal) {
                bulkGet.push(instanceVal.instanceId);
            });
            ElementService.getElements({
                elementIds: bulkGet, 
                projectId: projectOb.id,
                refId: refOb.id,
            }, 0).then(function(ignore) {
            var instances = [];
            operand.forEach(function(instanceVal) {
                instances.push(ElementService.getElement({
                    projectId: projectOb.id,
                    refId: refOb.id,
                    elementId: instanceVal.instanceId, 
                }, 0));
            });
            $q.all(instances).then(function(results) {
                var k = results.length - 1;
                for (; k >= 0; k--) {
                    var instance = results[k];
                    var hide = !$rootScope.veTreeShowPe;
                    instance._relatedDocuments = [
                        {
                            _parentViews: [{
                                name: viewNode.data.name,
                                sysmlId: viewNode.data.sysmlId
                            }],
                            name: documentOb.name,
                            sysmlId: documentOb.sysmlId,
                            projectId: projectOb.id,
                            refId: refOb.id
                        }
                    ];
                    if (ViewService.isSection(instance)) {
                        var sectionTreeNode = {
                            label : instance.name,
                            type : "section",
                            viewId : viewNode.data.sysmlId,
                            data : instance,
                            children: []
                        };
                        viewId2node[instance.sysmlId] = sectionTreeNode;
                        parentNode.children.unshift(sectionTreeNode);
                        addSectionElements(instance, viewNode, sectionTreeNode);
                    } else if (ViewService.getTreeType(instance)) {
                        var otherTreeNode = {
                            label : instance.name,
                            type : ViewService.getTreeType(instance),
                            viewId : viewNode.data.sysmlId,
                            data : instance,
                            hide: hide,
                            children: []
                        };
                        parentNode.children.unshift(otherTreeNode);
                    }
                }
                $scope.treeApi.refresh();
                resetPeTreeList('all');
            }, function(reason) {
                //view is bad
            });
          }, function(reason) {
          });
        };

          
        if (element._contents) {
            contents = element._contents;
        } else if (ViewService.isSection(element) && element.specification) {
            contents = element.specification; // For Sections, the contents expression is the specification
        } else {
            //bad?
        }
        if (contents && contents.operand) {
            addContentsSectionTreeNode(contents.operand);
        }
    }

    $scope.treeClickHandler = function(branch) {
    //TODO handle project state
        /*if ($state.includes('project') && !$state.includes('project.ref')) {
            if (branch.type === 'branch') {
                $state.go('workspace', {workspace: branch.data.id, tag: undefined, search: undefined});
            } else if (branch.type === 'configuration') {
                $state.go('workspace', {workspace: branch.workspace, tag: branch.data.id, search: undefined});
            }
        } else*/ if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            if (branch.type === 'group') {
                $state.go('project.ref.preview', {documentId: branch.data.sysmlId + '_cover', search: undefined});
            } else if (branch.type === 'view' || branch.type === 'snapshot') {
                $state.go('project.ref.preview', {documentId: branch.data.sysmlId, search: undefined});
            }
        } else if ($state.includes('project.ref.document')) {
            var viewId = (branch.type !== 'view') ? branch.viewId : branch.data.sysmlId;
            var sectionId = branch.type === 'section' ? branch.data.sysmlId : null;
            var hash = branch.data.sysmlId;
            if ($rootScope.ve_fullDocMode) {
                $location.hash(hash);
                $anchorScroll();
            } else if (branch.type === 'view' || branch.type === 'section') {
                $state.go('project.ref.document.view', {viewId: branch.data.sysmlId, search: undefined});
            } else {
                $state.go('project.ref.document.view', {viewId: viewId, search: undefined});
                $timeout(function() {
                    $location.hash(hash);
                    $anchorScroll();
                }, 1000, false);
            }
        }
        $rootScope.ve_tbApi.select('element-viewer');
    };

    $scope.treeDblclickHandler = function(branch) {
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            if (branch.type === 'group')
                $rootScope.mms_treeApi.expand_branch(branch);
            else if (branch.type === 'view' || branch.type === 'snapshot') {
                $state.go('project.ref.document', {documentId: branch.data.sysmlId, search: undefined});
            }
        } else if ($state.includes('project.ref.document')) {
            $rootScope.mms_treeApi.expand_branch(branch);
        }
    };

    // TODO: Update sort function to handle all cases
    var treeSortFunction = function(a, b) {

        a.priority = 100;
        if (a.type === 'tag') {
            a.priority = 0 ;
        } else if (a.type === 'group') {
            a.priority = 1;
        } else if (a.type === 'view') {
            a.priority = 2;
        }

        b.priority = 100;
        if (b.type === 'tag') {
            b.priority = 0 ;
        } else if (b.type === 'group') {
            b.priority = 1;
        }
         else if (b.type === 'view') {
            b.priority = 2;
        }

        if(a.priority < b.priority) return -1;
        if(a.priority > b.priority) return 1;
        if (!a.label)
            a.label = '';
        if (!b.label)
            b.label = '';
        if(a.label.toLowerCase() < b.label.toLowerCase()) return -1;
        if(a.label.toLowerCase() > b.label.toLowerCase()) return 1;

        return 0;
    };

    $scope.treeOptions = {
        types: UxService.getTreeTypes()
    };
    if (!$state.includes('project.ref.document'))
        $scope.treeOptions.sort = treeSortFunction;
    // TODO: this is a hack, need to resolve in alternate way    
    $timeout(function() {
        $scope.treeApi.refresh();
    }, 5000);

    $scope.fullDocMode = function() {
        if ($rootScope.ve_fullDocMode) {
            $rootScope.ve_fullDocMode = false;
            $scope.bbApi.setToggleState("tree-full-document", false);
            var curBranch = $scope.treeApi.get_selected_branch();
            if (curBranch) {
                var viewId;
                if (curBranch.type !== 'view') {
                    if (curBranch.type == 'section' && curBranch.data.type === 'InstanceSpecification')
                        viewId = curBranch.data.sysmlId;
                    else
                        viewId = curBranch.viewId;
                }
                else
                    viewId = curBranch.data.sysmlId;
                $state.go('project.ref.document.view', {viewId: viewId, search: undefined});
            }
        } else {
            $rootScope.ve_fullDocMode = true;
            $scope.bbApi.setToggleState("tree-full-document", true);
            $state.go('project.ref.document.full', {search: undefined}); 
        }
    };

    var addItem = function(itemType) {
        $scope.itemType = itemType;
        $scope.newViewAggr = {type: 'shared'};
        var branch = $scope.treeApi.get_selected_branch();
        var templateUrlStr = "";
        var newBranchType = "";
        
        // Item specific setup: TODO fix branch and tag
        if (itemType === 'Branch') {
            if (!branch) {
                growl.warning("Add Task Error: Select a task or tag first");
                return;
            }
            if (branch.type === 'tag') {
                $scope.createWsParentId = branch.workspace;
                $scope.createWsTime = branch.data.timestamp;
                $scope.from = 'Tag ' + branch.data.name;
            } else {
                $scope.createWsParentId = branch.data.id;
                $scope.createWsTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss.sssZ');
                $scope.from = 'Task ' + branch.data.name;
            }
            templateUrlStr = 'partials/mms/new-task.html';
            newBranchType = 'branch';
        } else if (itemType === 'Tag') {
            if (!branch) {
                growl.warning("Add Tag Error: Select parent task first");
                return;
            } else if (branch.type != "branch") {
                growl.warning("Add Tag Error: Selection must be a task");
                return;
            }
            templateUrlStr = 'partials/mms/new-tag.html';
            newBranchType = 'tag';
        } else if (itemType === 'Document') {
            if (!branch || branch.type !== 'group') {
                growl.warning("Select a group to add document under");
                return;
            }
            $scope.addDocSite = branch.data.sysmlId;
            templateUrlStr = 'partials/mms/new-doc.html';
            newBranchType = 'view';
        } else if (itemType === 'View') {
            if (!branch) {
                growl.warning("Add View Error: Select parent view first");
                return;
            } else if (branch.type === "section") {
                growl.warning("Add View Error: Cannot add a child view to a section");
                return;
            } else if (branch.aggr === 'none') {
                growl.warning("Add View Error: Cannot add a child view to a non-owned and non-shared view.");
                return;
            }
            templateUrlStr = 'partials/mms/new-view.html';
            newBranchType = 'view';
        } else {
            growl.error("Add Item of Type " + itemType + " is not supported");
        }
        $scope.parentBranchData = branch.data;
        // Adds the branch:
        var instance = $uibModal.open({
            templateUrl: templateUrlStr,
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', '$filter', addItemCtrl]
        });
        instance.result.then(function(data) {
            var newbranch = {
                label: data.name,
                type: newBranchType,
                data: data,
                children: []
            };
            
            var top = false; //TODO fix tags and branch
            if (itemType === 'Tag') {
                newbranch.workspace = branch.data.id;
                top = true;
                //cannot go to it yet because there's no id
                growl.info("Tag is being created, please wait for a notification.");
                return;
            }
            if (itemType === 'Branch') {
                growl.info("Branch is being created, please wait for a notification.");
                return;
            } else if (itemType === 'Document') {
                newbranch.groupId = branch.data.sysmlId;
            }

            $scope.treeApi.add_branch(branch, newbranch, top);

            var addToFullDocView = function(node, curSection, prevSysml) {
                var lastChild = prevSysml;
                if (node.children) {
                    var num = 1;
                    node.children.forEach(function(cNode) {
                        $rootScope.$broadcast('newViewAdded', cNode.data.sysmlId, curSection + '.' + num, lastChild);
                        lastChild = addToFullDocView(cNode, curSection + '.' + num, cNode.data.sysmlId);
                        num = num + 1;
                    });
                }
                return lastChild;
            };

            if (itemType === 'View') {
                viewId2node[data.sysmlId] = newbranch;
                seenViewIds[data.sysmlId] = newbranch;
                newbranch.aggr = $scope.newViewAggr.type;
                var curNum = branch.children[branch.children.length-1].section;
                var prevBranch = $scope.treeApi.get_prev_branch(newbranch);
                while (prevBranch.type != 'view') {
                    prevBranch = $scope.treeApi.get_prev_branch(prevBranch);
                }
                MmsAppUtils.handleChildViews(data, $scope.newViewAggr.type, projectOb.id, refOb.id, handleSingleView, handleChildren)
                  .then(function(node) {
                      // handle full doc mode
                      if ($rootScope.ve_fullDocMode)
                          addToFullDocView(node, curNum, newbranch.data.sysmlId);
                      addViewSectionsRecursivelyForNode(node);
                });
                if (!$rootScope.ve_fullDocMode) 
                    $state.go('project.ref.document.view', {viewId: data.sysmlId, search: undefined});
                else {
                    if (prevBranch) {
                        $rootScope.$broadcast('newViewAdded', data.sysmlId, curNum, prevBranch.data.sysmlId);
                    } else {
                        $rootScope.$broadcast('newViewAdded', data.sysmlId, curNum, branch.data.sysmlId);
                    }
                }
            }
        });
    };

    var addItemCtrl = function($scope, $uibModalInstance, $filter) {
        $scope.createForm = true;
        $scope.oking = false;
        var displayName = "";

        // Item specific setup:
        if ($scope.itemType === 'Branch') {
            $scope.newRef = {
                name: '',
                description: '',
                permission: 'read'
            };
            displayName = "Task";
        } else if ($scope.itemType === 'Tag') {
            $scope.newTag = {
                name: '',
                description: '',
                now: "true"
            };
            displayName = "Tag";
        } else if ($scope.itemType === 'Document') {
            $scope.newDoc = {name: ""};
            displayName = "Document";
        } else if ($scope.itemType === 'View') {
            $scope.newView = {name: ''};
            displayName = "View";
        } else {
            growl.error("Add Item of Type " + $scope.itemType + " is not supported");
            return;
        }
       
        var addExistingView = function(view) {
            var viewId = view.sysmlId;
            if (seenViewIds[viewId]) {
                growl.error("Error: View " + view.name + " is already in this document.");
                return;
            }
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;  
            ViewService.addViewToParentView({
                parentViewId: $scope.parentBranchData.sysmlId,
                viewId: viewId,
                projectId: $scope.parentBranchData._projectId,
                refId: $scope.parentBranchData._refId
            }).then(function(data) {
                growl.success("View Added");
                $uibModalInstance.close('');
            }, function(reason) {
                growl.error("View Add Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            }); 
        };

        var searchFilter = function(results) {
            var views = [];
            for (var i = 0; i < results.length; i++) {
                if (UtilsService.isView(results[i])) {
                    views.push(results[i]);
                    if (results[i].properties)
                        delete results[i].properties;
                }
            }
            return views;
        };
        $scope.searchOptions = {
            callback: addExistingView,
            itemsPerPage: 200,
            filterCallback: searchFilter
        };

        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise;

            // Item specific promise: //TODO branch and tags
            if ($scope.itemType === 'Branch') {
                var newRefObj = {"name": $scope.newRef.name, "description": $scope.newRef.description,
                                    "permission": $scope.newRef.permission};
                newRefObj.parent = $scope.createWsParentId;
                newRefObj.branched = $scope.createWsTime;
                promise = ProjectService.createRef(newRefObj);
            } else if ($scope.itemType === 'Tag') {
                var newTagObj = {"name": $scope.newTag.name, "description": $scope.newTag.description};
                if ($scope.newTag.now === "false") {
                    newTagObj.timestamp = $filter('date')($scope.newTag.timestamp, 'yyyy-MM-ddTHH:mm:ss.sssZ');
                }
                promise = ProjectService.createConfig(newTagObj, $scope.createConfigParentId);
            } else if ($scope.itemType === 'Document') {
                promise = ViewService.createDocument({
                    _projectId: projectOb.id,
                    _refId: refOb.id,
                    sysmlId: $scope.parentBranchData.sysmlId
                },{
                    viewName: $scope.newDoc.name,
                    isDoc: true
                });
            } else if ($scope.itemType === 'View') {
                $scope.newViewAggr.type = "composite";
                promise = ViewService.createView($scope.parentBranchData, {
                    viewName: $scope.newView.name
                });
            } else {
                growl.error("Add Item of Type " + $scope.itemType + " is not supported");
                $scope.oking = false;
                return;
            }

            promise.then(function(data) {
                growl.success(displayName+" Created");
                if ($scope.itemType === 'Tag') {
                    growl.info('Please wait for a completion email prior to viewing of the tag.');
                }
                $uibModalInstance.close(data);
            }, function(reason) {
                growl.error("Create "+displayName+" Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });
        };

        $scope.cancel = function() {
            $uibModalInstance.dismiss();
        };
    };

    $scope.deleteItem = function() {
        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Delete Error: Select item to delete.");
            return;
        }
        if ($state.includes('project.ref.document')) { 
            if (branch.type !== 'view' || (!UtilsService.isView(branch.data))) {
                growl.warning("Delete Error: Selected item is not a view.");
                return;
            }
        }
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            if (branch.type !== 'view' || (!UtilsService.isDocument(branch.data))) {
                growl.warning("Delete Error: Selected item is not a document.");
                return;
            }
        }
        // TODO: do not pass selected branch in scope, move page to generic location
        $scope.deleteBranch = branch;
        var instance = $uibModal.open({
            templateUrl: 'partials/mms/delete.html',
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', deleteCtrl]
        });
        instance.result.then(function(data) {
            // If the deleted item is a configration, then all of its child workspaces
            // are re-associated with the parent task of the configuration
            if (branch.type === 'tag') {
                var parentWsBranch = $scope.treeApi.get_parent_branch(branch);
                branch.children.forEach(function(branchChild) {
                    parentWsBranch.children.push(branchChild);
                });
            }
            $scope.treeApi.remove_branch(branch);
            if ($state.includes('project.ref.document') && branch.type === 'view') {
                processDeletedViewBranch(branch);
            }
            if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
                return;
            }
            if ($rootScope.ve_fullDocMode) {
                $state.go('project.ref.document.full', {search: undefined});
                $state.reload();
            } else {
                $state.go('^', {search: undefined});
            }
        });
    };

    // TODO: Make this a generic delete controller
    var deleteCtrl = function($scope, $uibModalInstance) {
        $scope.oking = false;
        var branch = $scope.deleteBranch;
        if (branch.type === 'branch')
            $scope.type = 'Task';
        if (branch.type === 'tag')
            $scope.type = 'Tag';
        if (branch.type === 'view') {
            $scope.type = 'View';
            if (UtilsService.isDocument(branch.data))
                $scope.type = 'Document';
        }
        //$scope.type = branch.type === 'workspace' ? 'task' : 'tag';
        $scope.name = branch.data.name;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise = null;
            if (branch.type === "branch" || branch.type === 'tag') {
                promise = ProjectService.deleteRef(branch.data.id, projectOb.id);
            } else if (branch.type === 'view') {
                var parentBranch = $scope.treeApi.get_parent_branch(branch);
                if (!$state.includes('project.ref.document')) {
                    promise = ViewService.downgradeDocument(branch.data);
                } else {
                    promise = ViewService.removeViewFromParentView({
                        projectId: parentBranch.data._projectId,
                        refId: parentBranch.data._refId,
                        parentViewId: parentBranch.data.sysmlId,
                        viewId: branch.data.sysmlId
                    });
                }
            }
            promise.then(function(data) {
                growl.success($scope.type + " Deleted");
                $uibModalInstance.close('ok');
            }, function(reason) {
                growl.error($scope.type + ' Delete Error: ' + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });
        };
        $scope.cancel = function() {
            $uibModalInstance.dismiss();
        };
    };

    function addViewSections(view) {
        var node = viewId2node[view.sysmlId];
        addSectionElements(view, node, node);
    }

    function addViewSectionsRecursivelyForNode(node) {
        addViewSections(node.data);
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i].type === 'view') {
                addViewSectionsRecursivelyForNode(node.children[i]);
            }
        }
    }

    function setPeVisibility(branch) {
        if (branch.type === 'figure' || branch.type === 'table' || branch.type === 'equation') {
            branch.hide = !$rootScope.veTreeShowPe;
        }
        for (var i = 0; i < branch.children.length; i++) {
            setPeVisibility(branch.children[i]);
        }
    }

    // MmsAppUtils.addElementCtrl creates this event when adding sections, table and figures to the view
    $scope.$on('viewctrl.add.element', function(event, instanceSpec, elemType, parentBranchData) {
        if (elemType === 'paragraph' || elemType === 'list' || elemType === 'comment')
            return;
        var branch = $scope.treeApi.get_branch(parentBranchData);
        var viewId = null;
        if (branch.type === 'section')
            viewId = branch.viewId;
        else
            viewId = branch.data.sysmlId;
        var viewNode = viewId2node[viewId];
        instanceSpec._relatedDocuments = [{
                _parentViews: [{
                    name: viewNode.data.name,
                    sysmlId: viewNode.data.sysmlId
                }],
                name: documentOb.name,
                sysmlId: documentOb.sysmlId,
                projectId: documentOb._projectId
            }
        ];
        var newbranch = {
            label: instanceSpec.name,
            type: (elemType === 'image' ? 'figure' : elemType),
            viewId: viewId,
            data: instanceSpec,
            hide: !$rootScope.veTreeShowPe && elemType !== 'section',
            children: []
        };
        var i = 0;
        var lastSection = -1;
        var childViewFound = false;
        for (i = 0; i < branch.children.length; i++) {
            if (branch.children[i].type === 'view') {
                lastSection = i-1;
                childViewFound = true;
                break;
            }
        }
        if (lastSection == -1 && !childViewFound) {//case when first child is view
            lastSection = branch.children.length-1;
        }
        branch.children.splice(lastSection+1, 0, newbranch);
        if (elemType == 'section') {
            addSectionElements(instanceSpec, viewNode, newbranch);
        }
        $scope.treeApi.refresh();
        resetPeTreeList(elemType);
    });

    // Utils creates this event when deleting instances from the view
    $scope.$on('viewctrl.delete.element', function(event, elementData) {
        var branch = $scope.treeApi.get_branch(elementData);
        if (branch)
            $scope.treeApi.remove_single_branch(branch);
        resetPeTreeList(branch.type);
    });

    $scope.$on('view.reorder.saved', function(event, vid) {
        var node = viewId2node[vid];
        var viewNode = node;
        var newChildren = [];
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (child.type === 'view')
                newChildren.push(child);
        }
        node.children = newChildren;
        if (node.type === 'section') {
            viewNode = viewId2node[node.view];
            if (!viewNode)
                viewNode = node;
        }
        addSectionElements(node.data, viewNode, node);
    });

    //TODO refresh table and fig list when new item added, deleted or reordered
    $scope.user_clicks_branch = function(branch) {
        $rootScope.mms_treeApi.user_clicks_branch(branch);
    };
}]);