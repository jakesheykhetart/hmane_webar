"""Build runtime data: python build_animation.py ASSET_ZIP STROKES_3DM ALIGNED_ZIP OUTPUT_JSON.
Requires numpy, scipy, rhino3dm. Source assets remain outside the runtime repository.
"""
import sys,json,struct,zipfile,numpy as np,rhino3dm as rh
from scipy.spatial.transform import Rotation
from pathlib import Path
src=zipfile.ZipFile(sys.argv[1]); adjusted=zipfile.ZipFile(sys.argv[3]); alignment=json.loads(adjusted.read('alignment.json'))
def read(b):
 n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);buf=b[28+n:]
 def verts(i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];return np.ndarray((a['count'],3),dtype='<f4',buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',12),4)).copy().astype(float)
 parent={c:i for i,n in enumerate(j['nodes']) for c in n.get('children',[])}
 def ancestry(i):
  chain=[i]
  while chain[-1] in parent:chain.append(parent[chain[-1]])
  return chain
 def points(i):
  p=verts(j['meshes'][j['nodes'][i]['mesh']]['primitives'][0]['attributes']['POSITION'])
  for k in ancestry(i):
   n=j['nodes'][k];p+=n.get('translation',[0,0,0])
  return p
 loc={}
 for i,n in enumerate(j['nodes']):
  if 'mesh' not in n:continue
  p=points(i)
  if len(p) not in (92,136):continue
  labels=[j['nodes'][k].get('name','') for k in ancestry(i)]
  for key in ['LOC WATERBAG','LOC STYLUS GRIP','LOC STYLUS NIB','LOC PENCASE TOP','LOC INKWELL BLACK','LOC PALETTE','LOC PENCASE','LOC SIL']:
   if key in labels:loc[key]=p;break
 return j,loc,points,ancestry
base,bl,bpoints,ancestry=read(src.read('CHAPTER 3 ASSETS/glb/SCRIBAL IMPLEMENT.glb'))
parts={'stylus':'LOC STYLUS GRIP','waterbag':'LOC WATERBAG','lid':'LOC PENCASE TOP','pencase':'LOC PENCASE','palette':'LOC PALETTE','silhouette':'LOC SIL'}
def rigid(a,b):
 # Vertex correspondence recovers the marker orientation, not just its origin.
 ac=a.mean(0);bc=b.mean(0);u,s,v=np.linalg.svd((a-ac).T@(b-bc));rr=v.T@u.T
 if np.linalg.det(rr)<0:v[-1]*=-1;rr=v.T@u.T
 tr=bc-rr@ac;return rr,tr,float(np.max(np.linalg.norm(a@rr.T+tr-b,axis=1)))
frames={};worst=0
for k in range(1,18):
 name=next(n for n in src.namelist() if n.split('/')[-1].startswith(f'KEYFRAME {k}.glb' if k<6 else f'KEYFRAME {k} ') and n.endswith('.glb'))
 short='glb/'+name.split('/')[-1];raw=adjusted.read(short) if short in adjusted.namelist() else src.read(name)
 _,loc,_,_=read(raw);fr={}
 for part,key in parts.items():
  if key not in loc:continue
  rr,tr,err=rigid(bl[key],loc[key]);worst=max(worst,err)
  # Pin grip exactly; the marker's box center is the documented pivot.
  pivot=(bl[key].min(0)+bl[key].max(0))/2;target=rr@pivot+tr
  fr[part]={'q':Rotation.from_matrix(rr).as_quat().tolist(),'pivot':target.tolist()}
 fr['nib']=((loc['LOC STYLUS NIB'].min(0)+loc['LOC STYLUS NIB'].max(0))/2).tolist()
 fr['ink']=((loc['LOC INKWELL BLACK'].min(0)+loc['LOC INKWELL BLACK'].max(0))/2).tolist()
 # For writing and ink dipping, guarantee the contact point while retaining orientation.
 if k>=5:
  rr=Rotation.from_quat(fr['stylus']['q']).as_matrix();pivot=(bl['LOC STYLUS GRIP'].min(0)+bl['LOC STYLUS GRIP'].max(0))/2
  nib=(bl['LOC STYLUS NIB'].min(0)+bl['LOC STYLUS NIB'].max(0))/2
  contact=np.array(fr['nib']) if k>=6 else np.array(fr['ink'])
  fr['stylus']['pivot']=(contact-rr@(nib-pivot)).tolist();fr['nib']=contact.tolist()
 frames[str(k)]=fr
meshparts={}
for i,n in enumerate(base['nodes']):
 if 'mesh' not in n:continue
 labels=[base['nodes'][k].get('name','') for k in ancestry(i)]
 if any(x.startswith('LOC') for x in labels):continue
 part='stylus' if 'STYLUS' in labels else 'waterbag' if 'WATERBAG' in labels else 'lid' if 'PENCASE TOP' in labels else 'pencase' if 'PENCASE' in labels else 'palette' if 'PALETTE BODY' in labels else 'silhouette' if 'SILHOUETTE' in labels else None
 if part:meshparts[str(n['mesh'])]=part
model=rh.File3dm.Read(sys.argv[2]);curves={model.Layers[o.Attributes.LayerIndex].Name:o.Geometry for o in model.Objects if isinstance(o.Geometry,rh.Curve)}
strokes=[]
for k in range(1,7):
 c=curves[f'STROKE {k:02d}'];d=c.Domain;start=next((x['curve_parameter'] for x in alignment if x['stroke']==f'STROKE {k:02d}'),d.T0)
 # Dense evaluation followed by arc-length resampling gives constant nib speed.
 t=np.linspace(start,start+d.T1-d.T0,4097) if c.IsClosed else np.linspace(d.T0,d.T1,4097)
 pts=[]
 for v in t:
  if c.IsClosed:v=d.T0+(v-d.T0)%(d.T1-d.T0)
  p=c.PointAt(float(v));pts.append([p.X/1000,p.Z/1000,-p.Y/1000])
 pts=np.array(pts);dist=np.r_[0,np.cumsum(np.linalg.norm(np.diff(pts,axis=0),axis=1))];at=np.linspace(0,dist[-1],257);out=np.array([np.interp(at,dist,pts[:,i]) for i in range(3)]).T
 if c.IsClosed:out[-1]=out[0]
 strokes.append({'name':f'STROKE {k:02d}','closed':c.IsClosed,'points':out.tolist(),'length':float(dist[-1])})
# Synchronize every drawing endpoint to its path, including small export rounding in 01/02.
for s,k in zip(strokes,[6,8,10,12,14,16]):
 for f,p in [(k,s['points'][0]),(k+1,s['points'][-1])]:
  delta=np.array(p)-frames[str(f)]['nib'];frames[str(f)]['stylus']['pivot']=(np.array(frames[str(f)]['stylus']['pivot'])+delta).tolist();frames[str(f)]['nib']=p
pivots={part:((bl[key].min(0)+bl[key].max(0))/2).tolist() for part,key in parts.items()}
data={'version':1,'coordinateSystem':'glTF meters; Rhino (X,Z,-Y)/1000','parts':meshparts,'pivots':pivots,'baseNib':((bl['LOC STYLUS NIB'].min(0)+bl['LOC STYLUS NIB'].max(0))/2).tolist(),'baseInk':((bl['LOC INKWELL BLACK'].min(0)+bl['LOC INKWELL BLACK'].max(0))/2).tolist(),'frames':frames,'strokes':strokes}
Path(sys.argv[4]).write_text(json.dumps(data,separators=(',',':')))
print('Generated 17 poses and 6 paths. Maximum marker fit residual:',worst,'m')
assert worst<1e-5
