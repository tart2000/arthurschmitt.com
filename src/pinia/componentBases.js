import { defineStore } from 'pinia';
import { getInheritedConfiguration } from '@/_common/helpers/configuration/configuration';
 
/* wwFront:start */
// eslint-disable-next-line no-undef
import plugin2bd1c68831c5443eae2559aa5b6431fb from '@weweb-internal/ext-plugin-2bd1c688-31c5-443e-ae25-59aa5b6431fb/config';
import section99586bd32b154d6ba0256a50d07ca845 from '@weweb-internal/ext-section-99586bd3-2b15-4d6b-a025-6a50d07ca845/config';
import wwobjectfd8c482f532c4aeba7ae6904a6b62a1b from '@weweb-internal/ext-element-fd8c482f-532c-4aeb-a7ae-6904a6b62a1b/config';
import wwobject83d890fb84f94386b459fb4be89a8e15 from '@weweb-internal/ext-element-83d890fb-84f9-4386-b459-fb4be89a8e15/config';
import wwobject6f8796b18273498d95fc7013b7c63214 from '@weweb-internal/ext-element-6f8796b1-8273-498d-95fc-7013b7c63214/config';
import wwobject1b1e21739b7842cca8eea6167caea340 from '@weweb-internal/ext-element-1b1e2173-9b78-42cc-a8ee-a6167caea340/config';
import wwobject9ae1fce82e314bfda4d20450235bdfd5 from '@weweb-internal/ext-element-9ae1fce8-2e31-4bfd-a4d2-0450235bdfd5/config';
import wwobject9ccf84b0e5424423869fb4828301ec49 from '@weweb-internal/ext-element-9ccf84b0-e542-4423-869f-b4828301ec49/config';
import wwobject985570fcb3c04566800482ab3b30a11d from '@weweb-internal/ext-element-985570fc-b3c0-4566-8004-82ab3b30a11d/config';
import wwobject0d3e75d19e7744cba2728b0825fbc5da from '@weweb-internal/ext-element-0d3e75d1-9e77-44cb-a272-8b0825fbc5da/config';
import wwobjectdeb10a015eef4aa190171b51c2ad6fd0 from '@weweb-internal/ext-element-deb10a01-5eef-4aa1-9017-1b51c2ad6fd0/config';
import wwobjectaeb78b9a6fb64c49931dfaedcfad67ba from '@weweb-internal/ext-element-aeb78b9a-6fb6-4c49-931d-faedcfad67ba/config';
import wwobjectd7904e9dfc9a4d809e32728e097879ad from '@weweb-internal/ext-element-d7904e9d-fc9a-4d80-9e32-728e097879ad/config';
import wwobject59dca300db7842e4a7a60cbf22d3cc82 from '@weweb-internal/ext-element-59dca300-db78-42e4-a7a6-0cbf22d3cc82/config';
import wwobjectb783dc65d5284f748c14e27c934c39b1 from '@weweb-internal/ext-element-b783dc65-d528-4f74-8c14-e27c934c39b1/config';
import wwobject3a7d637912d3438798ffb332bb492a63 from '@weweb-internal/ext-element-3a7d6379-12d3-4387-98ff-b332bb492a63/config';
import wwobject99ea5bf7b91e43ea8ec3dbaf2b171e34 from '@weweb-internal/ext-element-99ea5bf7-b91e-43ea-8ec3-dbaf2b171e34/config';
import wwobject69d0b3efb265494c8cd1874da4aa1834 from '@weweb-internal/ext-element-69d0b3ef-b265-494c-8cd1-874da4aa1834/config';
import wwobject53401515b6944c79a88dabeecb1de562 from '@weweb-internal/ext-element-53401515-b694-4c79-a88d-abeecb1de562/config';
import wwobject7179ba70c5d749a59828f85704fd1efc from '@weweb-internal/ext-element-7179ba70-c5d7-49a5-9828-f85704fd1efc/config';
import wwobject57831abf83ad49adba973bd30b035710 from '@weweb-internal/ext-element-57831abf-83ad-49ad-ba97-3bd30b035710/config';
/* wwFront:end */

export const useComponentBasesStore = defineStore('componentBases', () => {
    let configurations;
    /* wwFront:start */
    // eslint-disable-next-line no-undef
    configurations = {'plugin-2bd1c688-31c5-443e-ae25-59aa5b6431fb': getInheritedConfiguration({ ...plugin2bd1c68831c5443eae2559aa5b6431fb, name: 'plugin-2bd1c688-31c5-443e-ae25-59aa5b6431fb' }),
'section-99586bd3-2b15-4d6b-a025-6a50d07ca845': getInheritedConfiguration({ ...section99586bd32b154d6ba0256a50d07ca845, name: 'section-99586bd3-2b15-4d6b-a025-6a50d07ca845' }),
'wwobject-fd8c482f-532c-4aeb-a7ae-6904a6b62a1b': getInheritedConfiguration({ ...wwobjectfd8c482f532c4aeba7ae6904a6b62a1b, name: 'wwobject-fd8c482f-532c-4aeb-a7ae-6904a6b62a1b' }),
'wwobject-83d890fb-84f9-4386-b459-fb4be89a8e15': getInheritedConfiguration({ ...wwobject83d890fb84f94386b459fb4be89a8e15, name: 'wwobject-83d890fb-84f9-4386-b459-fb4be89a8e15' }),
'wwobject-6f8796b1-8273-498d-95fc-7013b7c63214': getInheritedConfiguration({ ...wwobject6f8796b18273498d95fc7013b7c63214, name: 'wwobject-6f8796b1-8273-498d-95fc-7013b7c63214' }),
'wwobject-1b1e2173-9b78-42cc-a8ee-a6167caea340': getInheritedConfiguration({ ...wwobject1b1e21739b7842cca8eea6167caea340, name: 'wwobject-1b1e2173-9b78-42cc-a8ee-a6167caea340' }),
'wwobject-9ae1fce8-2e31-4bfd-a4d2-0450235bdfd5': getInheritedConfiguration({ ...wwobject9ae1fce82e314bfda4d20450235bdfd5, name: 'wwobject-9ae1fce8-2e31-4bfd-a4d2-0450235bdfd5' }),
'wwobject-9ccf84b0-e542-4423-869f-b4828301ec49': getInheritedConfiguration({ ...wwobject9ccf84b0e5424423869fb4828301ec49, name: 'wwobject-9ccf84b0-e542-4423-869f-b4828301ec49' }),
'wwobject-985570fc-b3c0-4566-8004-82ab3b30a11d': getInheritedConfiguration({ ...wwobject985570fcb3c04566800482ab3b30a11d, name: 'wwobject-985570fc-b3c0-4566-8004-82ab3b30a11d' }),
'wwobject-0d3e75d1-9e77-44cb-a272-8b0825fbc5da': getInheritedConfiguration({ ...wwobject0d3e75d19e7744cba2728b0825fbc5da, name: 'wwobject-0d3e75d1-9e77-44cb-a272-8b0825fbc5da' }),
'wwobject-deb10a01-5eef-4aa1-9017-1b51c2ad6fd0': getInheritedConfiguration({ ...wwobjectdeb10a015eef4aa190171b51c2ad6fd0, name: 'wwobject-deb10a01-5eef-4aa1-9017-1b51c2ad6fd0' }),
'wwobject-aeb78b9a-6fb6-4c49-931d-faedcfad67ba': getInheritedConfiguration({ ...wwobjectaeb78b9a6fb64c49931dfaedcfad67ba, name: 'wwobject-aeb78b9a-6fb6-4c49-931d-faedcfad67ba' }),
'wwobject-d7904e9d-fc9a-4d80-9e32-728e097879ad': getInheritedConfiguration({ ...wwobjectd7904e9dfc9a4d809e32728e097879ad, name: 'wwobject-d7904e9d-fc9a-4d80-9e32-728e097879ad' }),
'wwobject-59dca300-db78-42e4-a7a6-0cbf22d3cc82': getInheritedConfiguration({ ...wwobject59dca300db7842e4a7a60cbf22d3cc82, name: 'wwobject-59dca300-db78-42e4-a7a6-0cbf22d3cc82' }),
'wwobject-b783dc65-d528-4f74-8c14-e27c934c39b1': getInheritedConfiguration({ ...wwobjectb783dc65d5284f748c14e27c934c39b1, name: 'wwobject-b783dc65-d528-4f74-8c14-e27c934c39b1' }),
'wwobject-3a7d6379-12d3-4387-98ff-b332bb492a63': getInheritedConfiguration({ ...wwobject3a7d637912d3438798ffb332bb492a63, name: 'wwobject-3a7d6379-12d3-4387-98ff-b332bb492a63' }),
'wwobject-99ea5bf7-b91e-43ea-8ec3-dbaf2b171e34': getInheritedConfiguration({ ...wwobject99ea5bf7b91e43ea8ec3dbaf2b171e34, name: 'wwobject-99ea5bf7-b91e-43ea-8ec3-dbaf2b171e34' }),
'wwobject-69d0b3ef-b265-494c-8cd1-874da4aa1834': getInheritedConfiguration({ ...wwobject69d0b3efb265494c8cd1874da4aa1834, name: 'wwobject-69d0b3ef-b265-494c-8cd1-874da4aa1834' }),
'wwobject-53401515-b694-4c79-a88d-abeecb1de562': getInheritedConfiguration({ ...wwobject53401515b6944c79a88dabeecb1de562, name: 'wwobject-53401515-b694-4c79-a88d-abeecb1de562' }),
'wwobject-7179ba70-c5d7-49a5-9828-f85704fd1efc': getInheritedConfiguration({ ...wwobject7179ba70c5d749a59828f85704fd1efc, name: 'wwobject-7179ba70-c5d7-49a5-9828-f85704fd1efc' }),
'wwobject-57831abf-83ad-49ad-ba97-3bd30b035710': getInheritedConfiguration({ ...wwobject57831abf83ad49adba973bd30b035710, name: 'wwobject-57831abf-83ad-49ad-ba97-3bd30b035710' })};
    /* wwFront:end */
 
    return {
        configurations,
     };
});
