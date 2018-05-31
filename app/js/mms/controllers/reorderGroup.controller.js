'use strict';

angular.module('mmsApp')
.controller('ReorderGroupCtrl', ['$scope', '$rootScope', '$stateParams', '$state', 'growl', '_', 'ElementService', 'CacheService', 'projectOb', 'refOb', 'groupObs', 'documentObs',

function ($scope, $rootScope, $stateParams, $state, growl, _, ElementService, CacheService, projectOb, refOb, groupObs, documentObs) {
    $scope.isSaving = false;
    $scope.treeOptions = {
        dropped: function (change) {},
        accept: function (sourceNodeScope, destNodeScope, destIndex) {
            return destNodeScope.node && destNodeScope.node.type === 'group';
        }
    };
    $scope.saveReorder = saveReorder;
    $scope.cancelReorder = cancelReorder;

    var tree = generateTree();
    sortRecursively(tree);
    $scope.tree = tree;

    function generateTree() {
        // create a node for each groupOb
        var tree = groupObs.map(function (groupOb) {
            return createNode(groupOb.name, 'group', [], groupOb);
        });

        // add document to its group
        documentObs
            .filter(function (documentOb) {
                return documentOb._groupId;
            })
            .forEach(function (documentOb) {
                var parent = _.find(tree, function (node) {
                    return node.data.id === documentOb._groupId;
                });
                if (parent) {
                    parent.children.push(createNode(documentOb.name, 'view', [], documentOb));
                }
            });

        // for any group that has a parent group, establish that connection
        tree.forEach(function (groupNode) {
            var foundParent = _.find(tree, function (node) {
                return node.data.id === groupNode.data._parentId;
            });
            if (foundParent) {
                groupNode.isChild = true;
                foundParent.children.push(groupNode);
            }
            return groupNode;
        });

        // only groups that don't have parents show up at root level
        tree = tree.filter(function (groupNode) {
            return !groupNode.isChild;
        });

        // add all the documents that don't belong to any group
        documentObs
            .filter(function (documentOb) {
                return !documentOb._groupId;
            })
            .forEach(function (documentOb) {
                tree.push(createNode(documentOb.name, 'view', [], documentOb));
            });
        return tree;
    }

    function createNode(name, type, chilldren, data) {
        return {name: name, type: type, children: chilldren, data: data};
    }

    function cancelReorder() {
        navigateAway(false);
    }

    function saveReorder() {
        if(!$scope.isSaving) {
            $scope.isSaving = true;
            var results = []; findNodesToUpdate(results);
            var elementsToUpdate = results.map(function(result) {
               return {
                   id: result.node.data.id,
                   ownerId: result.newOwnerId,
                   _projectId: projectOb.id,
                   _refId: refOb.id
               };
            });
            ElementService
                .updateElements(elementsToUpdate, false)
                .then(function() { cleanupCache(results); })
                .finally(function() { navigateAway(true); $scope.isSaving = false; });
        } else {
            growl.info("please wait");
        }
    }

    function findNodesToUpdate(result) {
        $scope.tree.forEach(function(node) {
            // handle change at the root level
            if (node.data.ownerId !== ('holding_bin_' + projectOb.id)) {
                result.push({node: node, newOwnerId: 'holding_bin_' + projectOb.id});
            }

            // handle change at lower level
            helper(node, result);
        });

        function helper(node, result) {
            node.children.forEach(function(childNode) {
                if (childNode.data.ownerId !== node.data.id) {
                    result.push({node: childNode, newOwnerId: node.data.id});
                }
                helper(childNode, result, false);
            });
        }
    }

    function cleanupCache(results) {
        // update cache for documents list and groups list
        var listOfDocInCache = CacheService.get(['documents', projectOb.id, refOb.id]);
        var listOfGroupInCache = CacheService.get(['groups', projectOb.id, refOb.id]);
        results.forEach(function(result) {
            if (result.node.type === 'group') {
                var cacheGroupOb =_.find(listOfGroupInCache, function(groupOb) {
                    return groupOb.id === result.node.data.id;
                });
                if(cacheGroupOb) {
                    cacheGroupOb._parentId = result.newOwnerId;
                }
            } else if (result.node.type === 'view') {
                var cacheDocument =_.find(listOfDocInCache, function(documentOb) {
                    return documentOb.id === result.node.data.id;
                });
                if(cacheDocument) {
                    // if the new owner is the projectId, set _groupId to undefined
                    cacheDocument._groupId = result.newOwnerId.indexOf(projectOb.id) !== -1 ? undefined : result.newOwnerId;
                }
            }
        });
    }

    function comparator(a, b) {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        } else {
            if (a.type === 'group') {
                return -1;
            } else {
                return 1;
            }
        }
    }

    function sortRecursively(nodes) {
        nodes.sort(comparator);
        nodes.forEach(function (node) {
            sortRecursively(node.children);
        });
    }

    function navigateAway(reload) {
        var curBranch = $rootScope.ve_treeApi.get_selected_branch();
        if (curBranch) {
            $state.go('project.ref.preview', {documentId: curBranch.data.id}, {reload: reload});
        } else {
            $state.go('project.ref', {}, {reload: reload});
        }
    }
}]);
